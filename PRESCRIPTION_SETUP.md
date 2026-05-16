# HealWise Prescription Feature - Setup Guide

## Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```
# Existing variables
@newBike4945=@newBike4945
MONGO_URI=mongodb://localhost:27017/healwise

# NEW: Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Getting Cloudinary Credentials

1. Sign up for a free account at https://cloudinary.com/
2. Go to your Dashboard
3. Copy your **Cloud Name** (shown at the top)
4. Go to Settings → API Keys
5. Copy your **API Key** and **API Secret**
6. Paste these into your `.env` file

## Installation Steps

### Backend
```bash
cd backend
pip install -r requirements.txt
```

### Frontend
```bash
cd healwise-frontend
npm install
```

## Feature Overview

### Doctor: Upload Prescriptions
- Navigate to "Upload Prescriptions" from doctor menu
- Select completed or accepted appointments
- Choose a PDF or image file (JPG, PNG)
- File is uploaded to Cloudinary and stored in MongoDB
- Prescriptions appear as checkmarks once uploaded

### Patient: View Prescriptions
- New "Prescriptions" screen in patient app
- Shows all prescriptions from doctors
- Displays doctor name, appointment date, and uploaded date
- Can download/view prescription files via Cloudinary link
- Optional doctor notes displayed

## API Endpoints

### Upload Prescription
```
POST /api/prescriptions/upload/<appointment_id>
Headers: Authorization: Bearer {token}
Body: FormData
  - prescription: File (PDF/JPG/PNG, max 10MB)
  - notes: string (optional)
```

### Get Patient Prescriptions
```
GET /api/prescriptions
Headers: Authorization: Bearer {token}
```

### Get Single Prescription
```
GET /api/prescriptions/<appointment_id>
Headers: Authorization: Bearer {token}
```

## Database Changes

New MongoDB collection: `prescriptions`
```javascript
{
  _id: ObjectId,
  appointmentId: String,
  doctorId: String,
  patientId: String,
  cloudinaryUrl: String,
  cloudinaryPublicId: String,
  fileType: String,
  notes?: String,
  uploadedAt: DateTime
}
```

## File Modifications

### Backend
- `backend/requirements.txt` - Added cloudinary
- `backend/app/config.py` - Added Cloudinary config
- `backend/app/controllers/prescription_controller.py` - NEW
- `backend/app/routes/prescription_routes.py` - NEW
- `backend/app/services/cloudinary_service.py` - NEW
- `backend/app/__init__.py` - Registered prescription routes

### Frontend
- `healwise-frontend/package.json` - Added expo-document-picker
- `healwise-frontend/services/doctorPanelService.ts` - Added upload/retrieve functions
- `healwise-frontend/app/(doctor)/upload-prescription.tsx` - REPLACED
- `healwise-frontend/app/(patient)/prescriptions.tsx` - NEW
- `healwise-frontend/app/(patient)/_layout.tsx` - Added prescriptions route

## Security Features

✅ JWT authentication required for all endpoints
✅ Doctors can only upload for their own appointments
✅ Patients can only view their own prescriptions
✅ File type validation (PDF, JPG, PNG only)
✅ File size limit: 10MB maximum
✅ Appointment status check (accepted or completed)
✅ Cloudinary upload security with signed URLs

## Testing Checklist

- [ ] Backend Cloudinary credentials configured
- [ ] pip install runs successfully
- [ ] npm install runs successfully  
- [ ] Doctor can see completed appointments
- [ ] Doctor can select and upload PDF/image file
- [ ] File appears in Cloudinary dashboard
- [ ] Prescription data stored in MongoDB
- [ ] Patient can view all prescriptions
- [ ] Patient can open/download prescription
- [ ] File type validation works (rejects non-PDF/image)
- [ ] File size validation works (rejects > 10MB)
- [ ] Unauthorized access returns 403 error
