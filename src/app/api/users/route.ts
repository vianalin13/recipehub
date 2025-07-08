//or can do separate get.ts and post.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'User API route works'});
}