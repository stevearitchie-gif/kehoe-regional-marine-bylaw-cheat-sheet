import {createHash} from "node:crypto";
import {initializeApp} from "firebase-admin/app";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {setGlobalOptions} from "firebase-functions/v2";
import {onSchedule} from "firebase-functions/v2/scheduler";

initializeApp();

setGlobalOptions({
  maxInstances: 10,
  region: "us-central1",
});

const normalizeSourceBody = (body: string, contentType: string): string => {
  const isHtml =
    contentType.includes("text/html") ||
    contentType.includes("application/xhtml+xml");

  const cleanedBody = isHtml ?
    body
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ") :
    body;

  return cleanedBody.replace(/\s+/g, " ").trim();
};

export const monthlySourceMonitorHeartbeat = onSchedule(
  {
    schedule: "0 6 1 * *",
    timeZone: "America/Toronto",
  },
  async () => {
    const db = getFirestore();
    const nowIso = new Date().toISOString();
    const runRef = db.collection("sourceMonitorRuns").doc();

    await runRef.set({
      type: "monthly-heartbeat",
      status: "ok",
      ranAt: FieldValue.serverTimestamp(),
      ranAtIso: nowIso,
      message: "Monthly source monitor is connected and running.",
    });

    logger.info("monthlySourceMonitorHeartbeat completed", {
      runId: runRef.id,
      ranAtIso: nowIso,
    });
  }
);

export const monthlySourceRegistryScan = onSchedule(
  {
    schedule: "5 6 1 * *",
    timeZone: "America/Toronto",
  },
  async () => {
    const db = getFirestore();
    const nowIso = new Date().toISOString();

    const snapshot = await db.collection("municipalities").get();

    let total = 0;
    let withSourceLink = 0;
    let missingSourceLink = 0;

    snapshot.forEach((docSnap) => {
      total++;
      const data = docSnap.data();
      const sourceLink = String(data.sourceLink ?? "").trim();

      if (sourceLink) {
        withSourceLink++;
      } else {
        missingSourceLink++;
      }
    });

    const runRef = db.collection("sourceMonitorRuns").doc();

    await runRef.set({
      type: "monthly-registry-scan",
      status: "ok",
      ranAt: FieldValue.serverTimestamp(),
      ranAtIso: nowIso,
      totalMunicipalities: total,
      withSourceLink,
      missingSourceLink,
      message: "Monthly source registry scan completed.",
    });

    logger.info("monthlySourceRegistryScan completed", {
      runId: runRef.id,
      totalMunicipalities: total,
      withSourceLink,
      missingSourceLink,
      ranAtIso: nowIso,
    });
  }
);

export const monthlySourceRegistryQueueBuild = onSchedule(
  {
    schedule: "10 6 1 * *",
    timeZone: "America/Toronto",
  },
  async () => {
    const db = getFirestore();
    const nowIso = new Date().toISOString();

    const snapshot = await db.collection("municipalities").get();

    let total = 0;
    let readyToMonitor = 0;
    let missingSourceLink = 0;

    for (const docSnap of snapshot.docs) {
      total++;
      const data = docSnap.data();

      const municipality = String(data.municipality ?? "").trim();
      const region = String(data.region ?? "").trim();
      const sourceLink = String(data.sourceLink ?? "").trim();
      const sourceSection = String(data.sourceSection ?? "").trim();

      const monitorStatus = sourceLink ? "ready" : "missing-source-link";

      if (sourceLink) {
        readyToMonitor++;
      } else {
        missingSourceLink++;
      }

      await db.collection("sourceMonitorCandidates").doc(docSnap.id).set({
        municipalityId: docSnap.id,
        municipality,
        region,
        sourceLink,
        sourceSection,
        monitorStatus,
        lastQueuedAt: FieldValue.serverTimestamp(),
        lastQueuedAtIso: nowIso,
      }, {merge: true});
    }

    const runRef = db.collection("sourceMonitorRuns").doc();

    await runRef.set({
      type: "monthly-registry-queue-build",
      status: "ok",
      ranAt: FieldValue.serverTimestamp(),
      ranAtIso: nowIso,
      totalMunicipalities: total,
      readyToMonitor,
      missingSourceLink,
      message: "Monthly source registry queue build completed.",
    });

    logger.info("monthlySourceRegistryQueueBuild completed", {
      runId: runRef.id,
      totalMunicipalities: total,
      readyToMonitor,
      missingSourceLink,
      ranAtIso: nowIso,
    });
  }
);
export const monthlySourceCandidateProbe = onSchedule(
  {
    schedule: "15 6 1 * *",
    timeZone: "America/Toronto",
  },
  async () => {
    const db = getFirestore();
    const nowIso = new Date().toISOString();

    const candidatesSnapshot = await db
      .collection("sourceMonitorCandidates")
      .where("monitorStatus", "==", "ready")
      .limit(10)
      .get();

    const runRef = db.collection("sourceMonitorRuns").doc();

    if (candidatesSnapshot.empty) {
      await runRef.set({
        type: "monthly-candidate-probe",
        status: "no-candidates",
        ranAt: FieldValue.serverTimestamp(),
        ranAtIso: nowIso,
        message: "No ready source monitor candidates were found.",
      });

      logger.info("monthlySourceCandidateProbe found no candidates", {
        runId: runRef.id,
        ranAtIso: nowIso,
      });

      return;
    }

    const candidateDoc = candidatesSnapshot.docs[0];
    const candidate = candidateDoc.data();

    const municipalityId = String(candidate.municipalityId ?? "").trim();
    const municipality = String(candidate.municipality ?? "").trim();
    const region = String(candidate.region ?? "").trim();
    const sourceLink = String(candidate.sourceLink ?? "").trim();
    const sourceSection = String(candidate.sourceSection ?? "").trim();
    const previousHash = String(candidate.lastContentHash ?? "").trim();

    if (!sourceLink) {
      await candidateDoc.ref.set({
        monitorStatus: "missing-source-link",
        lastCheckedAt: FieldValue.serverTimestamp(),
        lastCheckedAtIso: nowIso,
      }, {merge: true});

      await runRef.set({
        type: "monthly-candidate-probe",
        status: "missing-source-link",
        ranAt: FieldValue.serverTimestamp(),
        ranAtIso: nowIso,
        municipalityId,
        municipality,
        region,
        message: "Candidate was selected but sourceLink was empty.",
      });

      logger.info("monthlySourceCandidateProbe found empty sourceLink", {
        runId: runRef.id,
        municipalityId,
        municipality,
        region,
        ranAtIso: nowIso,
      });

      return;
    }

    try {
      const response = await fetch(sourceLink, {
        redirect: "follow",
        headers: {
          "user-agent": "By-Law Marine Construction Source Monitor/1.0",
        },
      });

      const finalUrl = response.url || sourceLink;
      const httpStatus = response.status;
      const contentType = response.headers.get("content-type") ?? "";
      const rawBody = await response.text();
      const normalizedBody = normalizeSourceBody(rawBody, contentType);
      const contentHash = createHash("sha256")
        .update(normalizedBody)
        .digest("hex");

      const changeDetected =
        Boolean(previousHash) && previousHash !== contentHash;
      const probeStatus = response.ok ? "fetched" : "http-error";

      await db.collection("sourceMonitorChecks").add({
        municipalityId,
        municipality,
        region,
        sourceLink,
        finalUrl,
        sourceSection,
        checkedAt: FieldValue.serverTimestamp(),
        checkedAtIso: nowIso,
        httpStatus,
        contentType,
        contentHash,
        previousHash,
        changeDetected,
        sampleText: normalizedBody.slice(0, 500),
        status: probeStatus,
      });

      if (changeDetected) {
        await db.collection("sourceMonitorChanges").add({
          municipalityId,
          municipality,
          region,
          sourceLink,
          finalUrl,
          sourceSection,
          detectedAt: FieldValue.serverTimestamp(),
          detectedAtIso: nowIso,
          previousHash,
          newHash: contentHash,
          status: "review-required",
          sampleText: normalizedBody.slice(0, 1000),
        });
      }

      await candidateDoc.ref.set({
        lastCheckedAt: FieldValue.serverTimestamp(),
        lastCheckedAtIso: nowIso,
        lastCheckedSourceLink: finalUrl,
        lastHttpStatus: httpStatus,
        lastContentType: contentType,
        lastContentHash: contentHash,
        lastCheckStatus: probeStatus,
        lastChangeDetected: changeDetected,
      }, {merge: true});
      await db.collection("municipalities").doc(municipalityId).set({
        lastSourceCheck: nowIso,
      }, {merge: true});

      await runRef.set({
        type: "monthly-candidate-probe",
        status: response.ok ? "ok" : "http-error",
        ranAt: FieldValue.serverTimestamp(),
        ranAtIso: nowIso,
        municipalityId,
        municipality,
        region,
        sourceLink,
        finalUrl,
        httpStatus,
        contentType,
        previousHash,
        contentHash,
        changeDetected,
        message: "Monthly source candidate probe completed.",
      });

      logger.info("monthlySourceCandidateProbe completed", {
        runId: runRef.id,
        municipalityId,
        municipality,
        region,
        sourceLink,
        finalUrl,
        httpStatus,
        contentType,
        previousHash,
        contentHash,
        changeDetected,
        ranAtIso: nowIso,
      });
    } catch (error) {
      const errorMessage =
          error instanceof Error ? error.message : String(error);

      await db.collection("sourceMonitorChecks").add({
        municipalityId,
        municipality,
        region,
        sourceLink,
        sourceSection,
        checkedAt: FieldValue.serverTimestamp(),
        checkedAtIso: nowIso,
        status: "fetch-failed",
        errorMessage,
      });

      await candidateDoc.ref.set({
        lastCheckedAt: FieldValue.serverTimestamp(),
        lastCheckedAtIso: nowIso,
        lastCheckStatus: "fetch-failed",
        lastErrorMessage: errorMessage,
      }, {merge: true});

      await runRef.set({
        type: "monthly-candidate-probe",
        status: "fetch-failed",
        ranAt: FieldValue.serverTimestamp(),
        ranAtIso: nowIso,
        municipalityId,
        municipality,
        region,
        sourceLink,
        errorMessage,
        message: "Monthly source candidate probe failed.",
      });

      logger.error("monthlySourceCandidateProbe failed", {
        runId: runRef.id,
        municipalityId,
        municipality,
        region,
        sourceLink,
        errorMessage,
        ranAtIso: nowIso,
      });
    }
  }
);

