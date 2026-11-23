const mongoose = require('mongoose');

const LEAD_STATUSES = ['New', 'Contacted', 'Follow Up', 'Qualified', 'Converted', 'Lost'];

const leadSchema = new mongoose.Schema(
  {
    // Meta lead id (leadgen_id). Unique so webhook retries / re-syncs / imports never duplicate.
    leadgenId: { type: String, trim: true, unique: true, sparse: true },

    // Contact details (extracted from Meta field_data)
    fullName: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },

    // Every answer from the lead form, in form order: [{ name, label, value }]
    fieldData: [
      {
        _id: false,
        name: String,
        value: String,
      },
    ],

    // Ad / form attribution
    pageId: { type: String, default: '' },
    formId: { type: String, default: '' },
    formName: { type: String, default: '' },
    adId: { type: String, default: '' },
    adName: { type: String, default: '' },
    adsetId: { type: String, default: '' },
    adsetName: { type: String, default: '' },
    campaignId: { type: String, default: '' },
    campaignName: { type: String, default: '' },
    platform: { type: String, default: '' }, // 'fb' | 'ig' | ...
    isOrganic: { type: Boolean, default: false },

    source: { type: String, enum: ['meta_webhook', 'meta_sync', 'import', 'manual'], default: 'meta_webhook' },

    // When the person submitted the form on Meta (falls back to createdAt)
    submittedAt: { type: Date, default: Date.now },

    // CRM workflow
    status: { type: String, enum: LEAD_STATUSES, default: 'New' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: String, default: '' },
    followUpDate: { type: Date, default: null },
  },
  { timestamps: true }
);

leadSchema.index({ submittedAt: -1 });
leadSchema.index({ status: 1, submittedAt: -1 });
leadSchema.index({ formId: 1 });
leadSchema.index({ campaignName: 1 });
leadSchema.index({ phone: 1 });
leadSchema.index({ email: 1 });

leadSchema.statics.STATUSES = LEAD_STATUSES;

module.exports = mongoose.model('Lead', leadSchema);
