
-- Drop existing orderNumber column
ALTER TABLE "Order"
  DROP COLUMN IF EXISTS "orderNumber";

-- Create trigger function to populate orderNumber
CREATE OR REPLACE FUNCTION assign_order_number()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.seq := nextval(pg_get_serial_sequence('"Order"', 'seq'));
  END IF;
  NEW."orderNumber" := to_char(NEW."createdAt", 'YYYY') || lpad(NEW.seq::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger before insert on Order
DROP TRIGGER IF EXISTS trg_assign_order_number ON "Order";
CREATE TRIGGER trg_assign_order_number
  BEFORE INSERT ON "Order"
  FOR EACH ROW EXECUTE FUNCTION assign_order_number();


