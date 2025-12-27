-- Create product_cycles table for managing delivery windows
CREATE TABLE public.product_cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name TEXT NOT NULL,
  cycle_name TEXT NOT NULL DEFAULT '',
  delivery_start DATE NOT NULL,
  delivery_end DATE NOT NULL,
  target_partner INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.product_cycles ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated admin access
CREATE POLICY "Authenticated users can view product cycles" 
ON public.product_cycles 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert product cycles" 
ON public.product_cycles 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update product cycles" 
ON public.product_cycles 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete product cycles" 
ON public.product_cycles 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_product_cycles_updated_at
BEFORE UPDATE ON public.product_cycles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for current products
INSERT INTO public.product_cycles (product_name, cycle_name, delivery_start, delivery_end, target_partner, is_active)
VALUES 
  ('LIFE-SENIOR-MORRADOK', 'Dec 2024', '2024-12-01', '2024-12-26', 1400, true),
  ('SAVING-RETIRE-GOLD', 'Dec 2024', '2024-12-01', '2024-12-26', 1050, true),
  ('HEALTH-PLUS-PREMIUM', 'Dec 2024', '2024-12-01', '2024-12-26', 1260, true),
  ('LIFE-PROTECT-FAMILY', 'Dec 2024', '2024-12-01', '2024-12-26', 840, true),
  ('SAVING-EDU-FUTURE', 'Dec 2024', '2024-12-01', '2024-12-26', 700, true),
  ('HEALTH-CRITICAL-CARE', 'Dec 2024', '2024-12-01', '2024-12-26', 350, true);