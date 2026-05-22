CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  number text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

INSERT INTO payment_methods (name, number, active)
VALUES
('bkash', '01977967580', true),
('nagad', '01352467585', true),
('rocket', '01842230442', true),
('upay', '01842230442', true)
ON CONFLICT (name) DO UPDATE
SET number = excluded.number,
active = true;
