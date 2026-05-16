# Prescription Feature - Quick Start Guide

## 🚀 Getting Started in 5 Steps

### Step 1: Configure Cloudinary
1. Sign up for free at https://cloudinary.com/
2. Copy your **Cloud Name** from Dashboard
3. Go to Settings → API Keys
4. Copy **API Key** and **API Secret**
5. Create `.env` file in `backend/` folder:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

### Step 2: Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Step 3: Install Frontend Dependencies
```bash
cd healwise-frontend
npm install
```

### Step 4: Start the Backend
```bash
cd backend
python run.py
# Backend should be running on http://localhost:5000
```

### Step 5: Start the Frontend
```bash
cd healwise-frontend
npm start
# Follow expo instructions to run on device/emulator
```

---

## 📱 Using the Prescription Feature

### For Doctors 👨‍⚕️
1. Log in with doctor account
2. Tap **"Upload Rx"** button on dashboard
3. Select an appointment with status **Completed** or **Accepted**
4. Tap **"Select & Upload"**
5. Choose a PDF or image file (max 10MB)
6. File uploads automatically
7. Checkmark ✅ appears when done

### For Patients 🧑‍🦰
1. Log in with patient account
2. Tap **"Prescriptions"** card on home screen (or use new Prescriptions tab)
3. See all prescriptions from your doctors
4. Read doctor name and specialization
5. See appointment date and upload date
6. Read optional doctor notes
7. Tap **"View/Download"** to open prescription

---

## ✅ Verify Installation

### Backend Check
```bash
curl http://localhost:5000/health
# Should return: {"status": "ok"}
```

### Test File Upload (Backend)
1. Get your doctor's JWT token
2. Call:
```bash
curl -X POST http://localhost:5000/api/prescriptions/upload/{appointmentId} \
  -H "Authorization: Bearer {token}" \
  -F "prescription=@test.pdf"
```

### Test List (Backend)
```bash
curl http://localhost:5000/api/prescriptions \
  -H "Authorization: Bearer {token}"
```

---

## 🎯 Testing Scenarios

| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| Doctor uploads prescription | Select completed appt → Choose PDF → Upload | File visible in Cloudinary, checkmark shown |
| Patient views prescriptions | Login as patient → Tap Prescriptions | List of all prescriptions displayed |
| Invalid file type | Try to upload .txt file | Error message appears |
| Oversized file | Try file > 10MB | Error message appears |
| Wrong doctor | Doctor tries to upload for another's appt | 403 Forbidden error |
| Patient views another's Rx | Patient calls GET API for different patient's appt | 403 Forbidden error |

---

## 🔐 Security Notes

✅ All APIs require JWT authentication
✅ Doctors can only upload for their own appointments
✅ Patients can only view their own prescriptions
✅ Only accepted/completed appointments can have prescriptions
✅ File types limited to: PDF, JPG, JPEG, PNG
✅ Maximum file size: 10MB

---

## 🐛 Troubleshooting

### Cloudinary Upload Fails
- Check credentials in `.env`
- Verify internet connection
- Check file isn't corrupted

### Frontend Dependencies Error
```bash
cd healwise-frontend
rm -rf node_modules package-lock.json
npm install
```

### Backend Port Already in Use
```bash
# Change port in your run.py or:
lsof -ti:5000 | xargs kill -9
```

### Files Not Showing After Upload
- Wait 2-3 seconds for MongoDB to save
- Refresh the patient prescriptions list
- Check browser console for errors

---

## 📚 File Locations

### Important Backend Files
- Cloudinary service: `backend/app/services/cloudinary_service.py`
- Prescription controller: `backend/app/controllers/prescription_controller.py`
- Routes: `backend/app/routes/prescription_routes.py`
- Config: `backend/app/config.py`

### Important Frontend Files
- Doctor upload screen: `healwise-frontend/app/(doctor)/upload-prescription.tsx`
- Patient prescriptions: `healwise-frontend/app/(patient)/prescriptions.tsx`
- Service functions: `healwise-frontend/services/doctorPanelService.ts`
- Home screen: `healwise-frontend/app/(patient)/home.tsx`

---

## 🎓 How It Works

```
Doctor Flow:
1. Doctor logs in
2. Views completed appointments
3. Selects appointment
4. Picks file from device
5. Uploads to Cloudinary
6. URL stored in MongoDB
7. Patient notified ✓

Patient Flow:
1. Patient logs in
2. Navigates to Prescriptions
3. Fetches from backend
4. Displays doctor + appointment info
5. Taps download button
6. Opens Cloudinary URL
7. Views/downloads file
```

---

## 📞 Support

For issues or questions:
1. Check MongoDB connection
2. Verify Cloudinary credentials
3. Check network tab in browser DevTools
4. Review backend logs for errors
5. Ensure JWT tokens are valid

---

## ✨ You're All Set!

The prescription feature is ready to use. Start with a test doctor appointment and try uploading a sample PDF to see it in action!
