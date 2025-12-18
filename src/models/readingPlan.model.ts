import mongoose, { Document, Schema } from 'mongoose';

// Interface for daily reading item
export interface IDailyReadingItem {
    book: string;
    startChapter: number;
    endChapter: number;
}

// Interface for daily reading entry
export interface IDailyReading {
    dayNumber: number;
    date: Date;
    readings: IDailyReadingItem[];
    isCompleted: boolean;
    completedAt?: Date;
}

// Interface for ReadingPlan
export interface IReadingPlan extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    startBook: string;
    startChapter: number;
    endBook: string;
    endChapter?: number;
    startDate: Date;
    durationInDays: number;
    endDate: Date; // Calculated virtual or stored
    dailyReadings: IDailyReading[];
    status: 'active' | 'completed' | 'paused';
    isPublic: boolean;
    originalPlanId?: mongoose.Types.ObjectId;
    sharedWith: mongoose.Types.ObjectId[];
    
    // Virtuals/Methods
    calculateEndDate(): Date;
}

const dailyReadingItemSchema = new Schema<IDailyReadingItem>({
    book: { type: String, required: true },
    startChapter: { type: Number, required: true },
    endChapter: { type: Number, required: true }
}, { _id: false });

const dailyReadingSchema = new Schema<IDailyReading>({
    dayNumber: { type: Number, required: true },
    date: { type: Date, required: true },
    readings: [dailyReadingItemSchema],
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date }
}, { _id: false });

const readingPlanSchema = new Schema<IReadingPlan>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    startBook: { type: String, required: true },
    startChapter: { type: Number, default: 1 },
    endBook: { type: String, required: true },
    endChapter: { type: Number },
    startDate: { type: Date, required: true },
    durationInDays: { type: Number, required: true, min: 1 },
    dailyReadings: [dailyReadingSchema],
    status: {
        type: String,
        enum: ['active', 'completed', 'paused'],
        default: 'active'
    },
    isPublic: { type: Boolean, default: false },
    originalPlanId: { type: Schema.Types.ObjectId, ref: 'ReadingPlan' },
    sharedWith: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, {
    timestamps: true
});

// Pre-save hook to ensure endDate is set? Or just a virtual. 
// The plan said "Method to calculate end date". Let's assume the client or controller populates the dailyReadings arrays which includes dates, 
// so the 'endDate' effectively is the date of the last dailyReading.
// However, the `durationInDays` is stored. 
// I'll add a virtual for endDate.

readingPlanSchema.virtual('endDate').get(function(this: IReadingPlan) {
    if (this.startDate && this.durationInDays) {
        const end = new Date(this.startDate);
        end.setDate(end.getDate() + this.durationInDays - 1);
        return end;
    }
    return null;
});

// Method to calculate end date (explicitly if needed, though virtual covers it)
readingPlanSchema.methods.calculateEndDate = function(): Date {
    const end = new Date(this.startDate);
    end.setDate(end.getDate() + this.durationInDays - 1);
    return end;
};

export const ReadingPlan = mongoose.model<IReadingPlan>('ReadingPlan', readingPlanSchema);
