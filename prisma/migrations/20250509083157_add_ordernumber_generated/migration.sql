
-- Drop existing orderNumber column
ALTER TABLE "Order"
  DROP COLUMN IF EXISTS "orderNumber";

-- Trigger-Funktion neu anlegen (ohne nextval)
CREATE OR REPLACE FUNCTION assign_order_number()
RETURNS trigger AS $$
BEGIN
  -- Prisma hat NEW.seq bereits per autoincrement gesetzt
  NEW."orderNumber" :=
    to_char(NEW."createdAt", 'YYYY')
    || lpad(NEW.seq::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger neu anlegen
DROP TRIGGER IF EXISTS trg_assign_order_number ON "Order";
CREATE TRIGGER trg_assign_order_number
  BEFORE INSERT ON "Order"
  FOR EACH ROW
  EXECUTE FUNCTION assign_order_number();
