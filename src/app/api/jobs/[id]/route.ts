import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  getJob,
  getJobItems,
  updateJobStatus,
  updateJobProgress,
  updateJobItem,
  deleteJob,
} from '@/lib/db';


const RESULTS_DIR = path.join(process.cwd(), 'data', 'results');

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const job = getJob(id);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // In direct generation mode, background tasks handle updates independently

    // Fetch updated job and items
    const updatedJob = getJob(id);
    const items = getJobItems(id).map(item => {
      if (item.output_image_path) {
        item.output_image_path = item.output_image_path.split(/[/\\]/).pop() || item.output_image_path;
      }
      return item;
    });

    return NextResponse.json({ job: updatedJob, items });
  } catch (error) {
    console.error('Failed to fetch job:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}



// DELETE - Cancel a job
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const job = getJob(id);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // In direct mode (synchronous execution), cancellation interrupts the request tracking in database.
    // Tasks themselves may complete in background, but the job status becomes 'cancelled'.
    if (job.status === 'pending' || job.status === 'processing') {
      updateJobStatus(job.id, 'cancelled');
    }

    // Delete job from database
    deleteJob(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to cancel job:', error);
    return NextResponse.json({ error: 'Failed to cancel job' }, { status: 500 });
  }
}
