-- Notification Settings Table
CREATE TABLE public.notification_settings (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push Subscriptions Table (Limit to 1 device per user)
CREATE TABLE public.push_subscriptions (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications History Table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'question_answered', 'question_request', 'schedule_change', 'place_added', 'visit_verified', 'level_up'
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_notifications_user_id_created_at ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_couple_id ON public.notifications(couple_id);

-- RLS Policies
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notification_settings
CREATE POLICY "Users can view own notification settings" ON public.notification_settings
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert/update own notification settings" ON public.notification_settings
    FOR ALL USING (auth.uid() = user_id);

-- Policies for push_subscriptions
CREATE POLICY "Users can view own push subscription" ON public.push_subscriptions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own push subscription" ON public.push_subscriptions
    FOR ALL USING (auth.uid() = user_id);

-- Policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications (mark as read)" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Function to handle profile creation (automatically create notification settings)
CREATE OR REPLACE FUNCTION public.handle_new_user_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notification_settings (user_id, is_enabled)
    VALUES (new.id, FALSE);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_notification
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_notification_settings();

-- Seed existing users
INSERT INTO public.notification_settings (user_id, is_enabled)
SELECT id, FALSE FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;
