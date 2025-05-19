import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { connectDB } from '@/app/lib/db';
import EmailTemplate from '@/app/models/EmailTemplate';
import mongoose from 'mongoose';
import { ApiError } from '@/app/lib/api';

// Helper: Check Admin Role
const checkAdmin = (session: any) => {
    if (!session?.user?.id || session.user.role !== 'admin') {
        throw new ApiError(401, 'Unauthorized: Admin access required');
    }
};

// --- PUT /api/admin/mails/templates/[templateId] (Update Template) ---
export async function PUT(req: NextRequest, { params }: { params: { templateId: string } }) {
    const session = await getServerSession(authOptions);
    try {
        checkAdmin(session);
        const templateId = params.templateId;
        if (!mongoose.Types.ObjectId.isValid(templateId)) {
            return NextResponse.json({ error: 'Invalid template ID format.' }, { status: 400 });
        }

        const { name, subject, body } = await req.json();

        // Basic validation: Allow partial updates, but check if at least one field is present?
        if (!name && !subject && !body) {
             return NextResponse.json({ error: 'No update data provided (name, subject, or body required).' }, { status: 400 });
        }

        await connectDB();

        const updateData: { [key: string]: any } = {};
        if (name) updateData.name = name;
        if (subject) updateData.subject = subject;
        if (body) updateData.body = body;
        // Update createdBy? Probably not. Keep track via logs if needed.

        const updatedTemplate = await EmailTemplate.findByIdAndUpdate(
            templateId,
            { $set: updateData },
            { new: true, runValidators: true } // Return updated, run validation
        );

        if (!updatedTemplate) {
            return NextResponse.json({ error: 'Template not found.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, template: updatedTemplate });

    } catch (error: any) {
        console.error(`Error updating template ${params.templateId}:`, error);
         if (error instanceof mongoose.Error.ValidationError) {
             const errors = Object.values(error.errors).map(el => el.message);
             return NextResponse.json({ error: `Validation failed: ${errors.join(', ')}` }, { status: 400 });
        }
        if (error.code === 11000 && error.keyPattern?.name) {
            return NextResponse.json({ error: 'A template with this name already exists.' }, { status: 409 });
        }
        if (error instanceof ApiError) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ error: 'Failed to update email template' }, { status: 500 });
    }
}

// --- DELETE /api/admin/mails/templates/[templateId] (Delete Template) ---
export async function DELETE(req: NextRequest, { params }: { params: { templateId: string } }) {
    const session = await getServerSession(authOptions);
    try {
        checkAdmin(session);
        const templateId = params.templateId;
        if (!mongoose.Types.ObjectId.isValid(templateId)) {
            return NextResponse.json({ error: 'Invalid template ID format.' }, { status: 400 });
        }

        await connectDB();

        const result = await EmailTemplate.findByIdAndDelete(templateId);

        if (!result) {
            return NextResponse.json({ error: 'Template not found.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Template deleted successfully.' });

    } catch (error: any) {
        console.error(`Error deleting template ${params.templateId}:`, error);
        if (error instanceof ApiError) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ error: 'Failed to delete email template' }, { status: 500 });
    }
} 