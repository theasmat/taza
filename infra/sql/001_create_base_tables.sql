-- QCom Platform Database Schema
-- Base tables for all services

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    roles VARCHAR(50)[] NOT NULL DEFAULT '{customer}',
    active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table (for role-specific data)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('customer', 'vendor', 'warehouse_staff', 'rider', 'admin')),
    warehouse_id UUID,
    vendor_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User delivery policies table
CREATE TABLE IF NOT EXISTS user_delivery_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    free_radius_km INTEGER NOT NULL DEFAULT 5,
    pay_mode VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (pay_mode IN ('user', 'seller')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    radius_km INTEGER NOT NULL DEFAULT 10,
    address TEXT NOT NULL,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    active BOOLEAN DEFAULT true,
    manager_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    brand VARCHAR(100),
    images TEXT[],
    attributes JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SKUs table
CREATE TABLE IF NOT EXISTS skus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    attributes JSONB NOT NULL,
    barcode VARCHAR(255) UNIQUE,
    weight_grams INTEGER NOT NULL DEFAULT 0,
    length_mm INTEGER,
    width_mm INTEGER,
    height_mm INTEGER,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prices table
CREATE TABLE IF NOT EXISTS prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE CASCADE,
    mrp DECIMAL(10, 2) NOT NULL,
    sale_price DECIMAL(10, 2) NOT NULL,
    tax_included BOOLEAN DEFAULT true,
    currency VARCHAR(3) DEFAULT 'INR',
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL,
    effective_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock table
CREATE TABLE IF NOT EXISTS stock (
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE CASCADE,
    on_hand INTEGER NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
    reserved INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
    reorder_level INTEGER DEFAULT 0,
    max_stock INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (warehouse_id, sku_id)
);

-- Stock movements table
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    sku_id UUID NOT NULL REFERENCES skus(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('IN', 'OUT', 'RESERVE', 'RELEASE', 'ADJUSTMENT')),
    quantity INTEGER NOT NULL,
    reference_id UUID,
    reference_type VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    sku_id UUID NOT NULL REFERENCES skus(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'RELEASED', 'EXPIRED')),
    order_id UUID,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    status VARCHAR(50) NOT NULL DEFAULT 'PLACED' CHECK (status IN ('PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED')),
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'COD' CHECK (payment_method IN ('COD')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED')),
    shipping_address JSONB NOT NULL,
    billing_address JSONB,
    notes TEXT,
    idempotency_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sku_id UUID NOT NULL REFERENCES skus(id),
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fulfillment tasks table
CREATE TABLE IF NOT EXISTS fulfillment_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    assigned_to UUID REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'ASSIGNED' CHECK (status IN ('ASSIGNED', 'PICKING', 'PICKED', 'PACKING', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED')),
    priority INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fulfillment task items table
CREATE TABLE IF NOT EXISTS fulfillment_task_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES fulfillment_tasks(id) ON DELETE CASCADE,
    sku_id UUID NOT NULL REFERENCES skus(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    picked_quantity INTEGER DEFAULT 0,
    picked_by UUID REFERENCES users(id),
    picked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Delivery assignments table
CREATE TABLE IF NOT EXISTS delivery_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    rider_id UUID NOT NULL REFERENCES users(id),
    task_id UUID NOT NULL REFERENCES fulfillment_tasks(id),
    status VARCHAR(50) NOT NULL DEFAULT 'ASSIGNED' CHECK (status IN ('ASSIGNED', 'ACCEPTED', 'PICKED', 'DELIVERED', 'CANCELLED')),
    estimated_delivery_time TIMESTAMP WITH TIME ZONE,
    actual_delivery_time TIMESTAMP WITH TIME ZONE,
    pickup_location GEOGRAPHY(POINT, 4326),
    delivery_location GEOGRAPHY(POINT, 4326),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    html_template TEXT NOT NULL,
    text_template TEXT,
    variables JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email logs table
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email VARCHAR(255) NOT NULL,
    recipient_user_id UUID REFERENCES users(id),
    template_name VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'BOUNCED')),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_type ON user_profiles(type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_warehouse_id ON user_profiles(warehouse_id);

CREATE INDEX IF NOT EXISTS idx_user_delivery_policies_user_id ON user_delivery_policies(user_id);

CREATE INDEX IF NOT EXISTS idx_warehouses_location ON warehouses USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_warehouses_active ON warehouses(active);

CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

CREATE INDEX IF NOT EXISTS idx_skus_product_id ON skus(product_id);
CREATE INDEX IF NOT EXISTS idx_skus_barcode ON skus(barcode);
CREATE INDEX IF NOT EXISTS idx_skus_active ON skus(active);

CREATE INDEX IF NOT EXISTS idx_prices_sku_id ON prices(sku_id);
CREATE INDEX IF NOT EXISTS idx_prices_effective ON prices(effective_from, effective_to);

CREATE INDEX IF NOT EXISTS idx_stock_warehouse_sku ON stock(warehouse_id, sku_id);
CREATE INDEX IF NOT EXISTS idx_stock_sku_id ON stock(sku_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_warehouse_id ON stock_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_sku_id ON stock_movements(sku_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);

CREATE INDEX IF NOT EXISTS idx_reservations_warehouse_id ON reservations(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_reservations_sku_id ON reservations(sku_id);
CREATE INDEX IF NOT EXISTS idx_reservations_order_id ON reservations(order_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_expires_at ON reservations(expires_at);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_warehouse_id ON orders(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_sku_id ON order_items(sku_id);

CREATE INDEX IF NOT EXISTS idx_fulfillment_tasks_order_id ON fulfillment_tasks(order_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_tasks_warehouse_id ON fulfillment_tasks(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_tasks_assigned_to ON fulfillment_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_fulfillment_tasks_status ON fulfillment_tasks(status);

CREATE INDEX IF NOT EXISTS idx_fulfillment_task_items_task_id ON fulfillment_task_items(task_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_task_items_sku_id ON fulfillment_task_items(sku_id);

CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order_id ON delivery_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_rider_id ON delivery_assignments(rider_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_status ON delivery_assignments(status);

CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(name);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(active);

CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_user_id ON email_logs(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);

-- Insert default email templates
INSERT INTO email_templates (name, subject, html_template, text_template, variables) VALUES
('order-placed', 'Order Confirmation - {{orderId}}', 
 '<html><body><h1>Order Confirmed</h1><p>Your order {{orderId}} has been placed successfully.</p><p>Total: {{total}}</p></body></html>',
 'Order Confirmed\n\nYour order {{orderId}} has been placed successfully.\nTotal: {{total}}',
 '["orderId", "total", "items"]'
),
('order-out-for-delivery', 'Your order is on the way! - {{orderId}}',
 '<html><body><h1>Out for Delivery</h1><p>Your order {{orderId}} is out for delivery and will arrive soon.</p></body></html>',
 'Out for Delivery\n\nYour order {{orderId}} is out for delivery and will arrive soon.',
 '["orderId", "estimatedDeliveryTime"]'
),
('order-delivered', 'Order Delivered - {{orderId}}',
 '<html><body><h1>Order Delivered</h1><p>Your order {{orderId}} has been delivered successfully.</p></body></html>',
 'Order Delivered\n\nYour order {{orderId}} has been delivered successfully.',
 '["orderId", "deliveredAt"]'
);

-- Create a default admin user (password: admin123)
INSERT INTO users (id, email, name, password_hash, roles, active) VALUES
('00000000-0000-0000-0000-000000000000', 
 'admin@qcom.com', 
 'System Administrator',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/J9eHCOOLq', -- admin123
 '{"admin"}',
 true
) ON CONFLICT (email) DO NOTHING;

-- Create default warehouses
INSERT INTO warehouses (id, name, location, radius_km, address, contact_phone, contact_email, active) VALUES
('11111111-1111-1111-1111-111111111111',
 'Mumbai Central Warehouse',
 ST_GeographyFromText('POINT(72.8777 19.0760)'),
 10,
 '123 Business Park, Mumbai, Maharashtra 400001',
 '+91-22-12345678',
 'mumbai.warehouse@qcom.com',
 true
),
('11111111-1111-1111-1111-111111111112',
 'Delhi Warehouse',
 ST_GeographyFromText('POINT(77.1025 28.7041)'),
 15,
 '456 Industrial Area, Delhi, Delhi 110001',
 '+91-11-23456789',
 'delhi.warehouse@qcom.com',
 true
) ON CONFLICT DO NOTHING;

-- Create default user delivery policies
INSERT INTO user_delivery_policies (user_id, free_radius_km, pay_mode) VALUES
('00000000-0000-0000-0000-000000000000', 5, 'user')
ON CONFLICT (user_id) DO NOTHING;