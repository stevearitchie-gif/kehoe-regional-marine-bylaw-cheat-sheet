import {createHash} from "node:crypto";
import {initializeApp} from "firebase-admin/app";
import {
  DocumentData,
  FieldValue,
  Firestore,
  getFirestore,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
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

type ProbeResult = {
  municipalityId: string;
  municipality: string;
  region: string;
  sourceLink: string;
  status: string;
  httpStatus?: number;
  changeDetected?: boolean;
  errorMessage?: string;
};

const sourceMonitorBatchSize = 100;
const emptyContentHash =
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

const probeSourceCandidate = async (
  db: Firestore,
  candidateDoc: QueryDocumentSnapshot<DocumentData>,
  nowIso: string
): Promise<ProbeResult> => {
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
      lastCheckStatus: "missing-source-link",
    }, {merge: true});

    return {
      municipalityId,
      municipality,
      region,
      sourceLink,
      status: "missing-source-link",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(sourceLink, {
      redirect: "follow",
      signal: controller.signal,
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

    const hasUsablePreviousHash =
      Boolean(previousHash) && previousHash !== emptyContentHash;
    const changeDetected =
      hasUsablePreviousHash && previousHash !== contentHash;
    const checkStatus = response.ok ? "fetched" : "http-error";

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
      status: checkStatus,
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
      monitorStatus: "ready",
      lastCheckedAt: FieldValue.serverTimestamp(),
      lastCheckedAtIso: nowIso,
      lastCheckedSourceLink: finalUrl,
      lastHttpStatus: httpStatus,
      lastContentType: contentType,
      lastContentHash: contentHash,
      lastCheckStatus: checkStatus,
      lastChangeDetected: changeDetected,
    }, {merge: true});

    await db.collection("municipalities").doc(municipalityId).set({
      lastSourceCheck: nowIso,
    }, {merge: true});

    return {
      municipalityId,
      municipality,
      region,
      sourceLink,
      status: response.ok ? "ok" : "http-error",
      httpStatus,
      changeDetected,
    };
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
      monitorStatus: "ready",
      lastCheckedAt: FieldValue.serverTimestamp(),
      lastCheckedAtIso: nowIso,
      lastCheckStatus: "fetch-failed",
      lastErrorMessage: errorMessage,
    }, {merge: true});

    return {
      municipalityId,
      municipality,
      region,
      sourceLink,
      status: "fetch-failed",
      errorMessage,
    };
  } finally {
    clearTimeout(timeout);
  }
};

export const monthlySourceCandidateProbe = onSchedule(
  {
    schedule: "15 6 1 * *",
    timeZone: "America/Toronto",
    timeoutSeconds: 540,
    memory: "512MiB",
  },
  async () => {
    const db = getFirestore();
    const nowIso = new Date().toISOString();
    const runRef = db.collection("sourceMonitorRuns").doc();

    const candidatesSnapshot = await db
      .collection("sourceMonitorCandidates")
      .where("monitorStatus", "==", "ready")
      .limit(sourceMonitorBatchSize)
      .get();

    if (candidatesSnapshot.empty) {
      await runRef.set({
        type: "monthly-candidate-probe",
        status: "no-candidates",
        ranAt: FieldValue.serverTimestamp(),
        ranAtIso: nowIso,
        checkedCount: 0,
        message: "No ready source monitor candidates were found.",
      });

      logger.info("monthlySourceCandidateProbe found no candidates", {
        runId: runRef.id,
        ranAtIso: nowIso,
      });

      return;
    }

    const results: ProbeResult[] = [];

    for (const candidateDoc of candidatesSnapshot.docs) {
      const result = await probeSourceCandidate(db, candidateDoc, nowIso);
      results.push(result);

      logger.info("monthlySourceCandidateProbe checked candidate", {
        municipalityId: result.municipalityId,
        municipality: result.municipality,
        region: result.region,
        status: result.status,
        httpStatus: result.httpStatus,
        changeDetected: result.changeDetected,
      });
    }

    const okCount = results.filter((item) => item.status === "ok").length;
    const httpErrorCount = results.filter(
      (item) => item.status === "http-error"
    ).length;
    const fetchFailedCount = results.filter(
      (item) => item.status === "fetch-failed"
    ).length;
    const missingSourceLinkCount = results.filter(
      (item) => item.status === "missing-source-link"
    ).length;
    const changeDetectedCount = results.filter(
      (item) => item.changeDetected === true
    ).length;

    await runRef.set({
      type: "monthly-candidate-probe",
      status: "completed",
      ranAt: FieldValue.serverTimestamp(),
      ranAtIso: nowIso,
      checkedCount: results.length,
      okCount,
      httpErrorCount,
      fetchFailedCount,
      missingSourceLinkCount,
      changeDetectedCount,
      batchLimit: sourceMonitorBatchSize,
      message: "Monthly source candidate probe batch completed.",
      results: results.map((item) => ({
        municipalityId: item.municipalityId,
        municipality: item.municipality,
        region: item.region,
        status: item.status,
        httpStatus: item.httpStatus ?? null,
        changeDetected: item.changeDetected ?? false,
        errorMessage: item.errorMessage ?? null,
      })),
    });

    logger.info("monthlySourceCandidateProbe batch completed", {
      runId: runRef.id,
      checkedCount: results.length,
      okCount,
      httpErrorCount,
      fetchFailedCount,
      missingSourceLinkCount,
      changeDetectedCount,
      ranAtIso: nowIso,
    });
  }
);
