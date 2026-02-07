import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');

  if (id) {
    const { rows } = await pool.query(
      'SELECT id, artist_name, flowers, created_at FROM arrangements WHERE id = $1',
      [id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  }

  const { rows } = await pool.query(
    'SELECT id, artist_name, flowers, created_at FROM arrangements ORDER BY created_at DESC'
  );
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const { artist_name, flowers } = await request.json();

  const { rows } = await pool.query(
    'INSERT INTO arrangements (artist_name, flowers) VALUES ($1, $2) RETURNING id',
    [artist_name, JSON.stringify(flowers)]
  );

  return NextResponse.json({ id: rows[0].id });
}
