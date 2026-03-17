
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/bylaws');
  return null;
}
