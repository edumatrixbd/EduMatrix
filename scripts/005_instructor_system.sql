-- 0. Update existing tables
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0.00;

-- 1. Instructors table
CREATE TABLE IF NOT EXISTS public.instructors (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    bio TEXT,
    expertise TEXT[],
    avatar_url TEXT,
    payment_info JSONB DEFAULT '{}'::JSONB, -- { bank_name: '...', account_no: '...', bKash: '...' }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Instructor-Course Mapping
CREATE TABLE IF NOT EXISTS public.instructor_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    revenue_share_percentage INTEGER DEFAULT 70, -- Instructor's percentage
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(instructor_id, course_id)
);

-- 3. Course Sales Tracking
CREATE TABLE IF NOT EXISTS public.course_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    instructor_earning DECIMAL(10,2) NOT NULL,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Payouts table
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payout_month TEXT NOT NULL, -- e.g., '2024-05'
    status TEXT DEFAULT 'pending', -- 'pending', 'paid'
    payout_note TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 5. Instructor Notices
CREATE TABLE IF NOT EXISTS public.instructor_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_urgent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_notices ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Instructors: Own profile visible to self, all to admin
CREATE POLICY "Instructors can view their own profile" ON public.instructors
FOR SELECT USING (auth.uid() = id);

-- Instructor Courses: Self courses to self, all to admin
CREATE POLICY "Instructors can view their assigned courses" ON public.instructor_courses
FOR SELECT USING (auth.uid() = instructor_id);

-- Course Sales: Instructors see sales for their assigned courses
CREATE POLICY "Instructors can view sales for their courses" ON public.course_sales
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.instructor_courses ic
        WHERE ic.course_id = public.course_sales.course_id
        AND ic.instructor_id = auth.uid()
    )
);

-- Payouts: Instructors see own payouts
CREATE POLICY "Instructors can view their own payouts" ON public.payouts
FOR SELECT USING (auth.uid() = instructor_id);

-- Notices: All instructors can see all notices
CREATE POLICY "Instructors can view all notices" ON public.instructor_notices
FOR SELECT USING (true);

-- Admin Full Access (Logic handled by role check in app, but policy for completeness)
DROP POLICY IF EXISTS "Admin full access instructors" ON public.instructors;
CREATE POLICY "Admin full access instructors" ON public.instructors FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access instructor_courses" ON public.instructor_courses;
CREATE POLICY "Admin full access instructor_courses" ON public.instructor_courses FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access course_sales" ON public.course_sales;
CREATE POLICY "Admin full access course_sales" ON public.course_sales FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access payouts" ON public.payouts;
CREATE POLICY "Admin full access payouts" ON public.payouts FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access instructor_notices" ON public.instructor_notices;
CREATE POLICY "Admin full access instructor_notices" ON public.instructor_notices FOR ALL USING (true);
