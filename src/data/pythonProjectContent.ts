import { AlgorithmStep } from '../types/billing';

export const PYTHON_SOURCE_CODE = `"""
====================================================================
Project Title : Shopping Billing System (Retail / Supermarket)
Subject       : Programming with Python (01AI0302) - Semester 3
Department    : CSE AI, ML and DS, Faculty of Engineering & Technology
University    : Marwadi University
Storage Files : inventory.json (Products), sales_history.csv (Bills),
                receipts/<invoice_no>.txt (Printable Receipts)
====================================================================
"""

import csv
import json
import os
from datetime import datetime

INVENTORY_FILE = "inventory.json"
SALES_CSV_FILE = "sales_history.csv"
RECEIPTS_DIR = "receipts"
STORE_NAME = "CAMPUS FRESH MART"
STORE_ADDRESS = "Marwadi Campus Road, Rajkot, Gujarat"

DEFAULT_INVENTORY = [
    {"id": "P101", "name": "Basmati Rice Premium", "category": "Groceries", "unit": "1 kg", "price": 145.0, "gst_rate": 5, "stock": 42},
    {"id": "P102", "name": "Whole Wheat Atta", "category": "Groceries", "unit": "5 kg", "price": 260.0, "gst_rate": 0, "stock": 30},
    {"id": "P103", "name": "Cold-Pressed Sunflower Oil", "category": "Groceries", "unit": "1 L", "price": 175.0, "gst_rate": 5, "stock": 26},
    {"id": "P104", "name": "Toor Dal Unpolished", "category": "Groceries", "unit": "1 kg", "price": 168.0, "gst_rate": 0, "stock": 18},
    {"id": "P105", "name": "Amul Taaza Toned Milk", "category": "Dairy", "unit": "1 L", "price": 54.0, "gst_rate": 0, "stock": 50},
    {"id": "P106", "name": "Salted Table Butter", "category": "Dairy", "unit": "500 g", "price": 285.0, "gst_rate": 12, "stock": 14},
    {"id": "P107", "name": "Fresh Malai Paneer", "category": "Dairy", "unit": "200 g", "price": 95.0, "gst_rate": 5, "stock": 8},
    {"id": "P108", "name": "Assam CTC Leaf Tea", "category": "Beverages", "unit": "500 g", "price": 240.0, "gst_rate": 5, "stock": 24},
    {"id": "P109", "name": "Arabica Instant Coffee", "category": "Beverages", "unit": "200 g", "price": 320.0, "gst_rate": 18, "stock": 16},
    {"id": "P110", "name": "Mixed Fruit Juice", "category": "Beverages", "unit": "1 L", "price": 110.0, "gst_rate": 12, "stock": 34},
    {"id": "P111", "name": "Multigrain Digestive Biscuits", "category": "Snacks", "unit": "400 g", "price": 65.0, "gst_rate": 18, "stock": 40},
    {"id": "P112", "name": "Roasted Salted Almonds", "category": "Snacks", "unit": "250 g", "price": 290.0, "gst_rate": 12, "stock": 9},
    {"id": "P113", "name": "Herbal Bath Soap (Pack of 4)", "category": "Personal Care", "unit": "4 pcs", "price": 160.0, "gst_rate": 18, "stock": 28},
    {"id": "P114", "name": "Mint Gel Toothpaste", "category": "Personal Care", "unit": "150 g", "price": 115.0, "gst_rate": 18, "stock": 22},
    {"id": "P115", "name": "Liquid Laundry Detergent", "category": "Household", "unit": "1 L", "price": 235.0, "gst_rate": 18, "stock": 19},
    {"id": "P116", "name": "Lemon Dishwash Gel", "category": "Household", "unit": "500 ml", "price": 125.0, "gst_rate": 18, "stock": 6},
]

CSV_HEADERS = [
    "invoice_no",
    "timestamp",
    "customer_name",
    "customer_phone",
    "item_count",
    "subtotal",
    "discount_percent",
    "discount_amount",
    "total_gst",
    "grand_total",
    "payment_method",
]


def load_inventory():
    """Load product catalog from inventory.json or seed defaults on first run."""
    if not os.path.exists(INVENTORY_FILE):
        save_inventory(DEFAULT_INVENTORY)
        return [item.copy() for item in DEFAULT_INVENTORY]
    try:
        with open(INVENTORY_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    except (json.JSONDecodeError, OSError):
        print("[Warning] Corrupted inventory.json detected. Restoring defaults.")
        save_inventory(DEFAULT_INVENTORY)
        return [item.copy() for item in DEFAULT_INVENTORY]


def save_inventory(inventory):
    """Persist updated product stock and catalog back to inventory.json."""
    with open(INVENTORY_FILE, "w", encoding="utf-8") as file:
        json.dump(inventory, file, indent=2)


def ensure_sales_csv():
    """Create sales_history.csv with header row if it does not yet exist."""
    if not os.path.exists(SALES_CSV_FILE):
        with open(SALES_CSV_FILE, "w", newline="", encoding="utf-8") as file:
            writer = csv.writer(file)
            writer.writerow(CSV_HEADERS)


def generate_next_invoice_no():
    """Read existing CSV rows and return the next sequential invoice ID."""
    ensure_sales_csv()
    max_num = 1000
    with open(SALES_CSV_FILE, "r", newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            inv_id = row.get("invoice_no", "")
            if inv_id.startswith("INV-"):
                try:
                    num = int(inv_id.split("-")[1])
                    if num > max_num:
                        max_num = num
                except ValueError:
                    continue
    return f"INV-{max_num + 1}"


def find_product(inventory, sku):
    """Case-insensitive lookup of a product dictionary by SKU code."""
    sku_upper = sku.strip().upper()
    for item in inventory:
        if item["id"].upper() == sku_upper:
            return item
    return None


def display_catalog(inventory):
    """Print the formatted retail product catalog with prices, GST, and stock."""
    print("\\n" + "=" * 78)
    print(f"{'SKU':<7} {'PRODUCT NAME':<30} {'CATEGORY':<14} {'PRICE':>8} {'GST':>5} {'STOCK':>7}")
    print("-" * 78)
    for item in inventory:
        stock_flag = "LOW" if 0 < item["stock"] <= 10 else ("OUT" if item["stock"] == 0 else "")
        stock_col = f"{item['stock']} {stock_flag}".strip()
        print(
            f"{item['id']:<7} {item['name'][:29]:<30} {item['category']:<14} "
            f"{item['price']:>8.2f} {item['gst_rate']:>4}% {stock_col:>7}"
        )
    print("=" * 78)


def get_auto_discount_percent(subtotal):
    """Apply tiered promotional discount: 10% >= Rs.2500, 5% >= Rs.1000."""
    if subtotal >= 2500:
        return 10
    if subtotal >= 1000:
        return 5
    return 0


def format_receipt(invoice):
    """Return a clean 54-column thermal receipt string for screen & file output."""
    width = 54
    line = "=" * width
    dash = "-" * width
    rows = [
        line,
        STORE_NAME.center(width),
        STORE_ADDRESS.center(width),
        "TAX INVOICE / RETAIL BILL".center(width),
        line,
        f"Invoice No : {invoice['invoice_no']:<20} Mode: {invoice['payment_method']}",
        f"Date/Time  : {invoice['timestamp']}",
        f"Customer   : {invoice['customer_name']} ({invoice['customer_phone']})",
        dash,
        f"{'ITEM':<24} {'QTY':>4} {'RATE':>7} {'GST':>5} {'AMOUNT':>10}",
        dash,
    ]
    for entry in invoice["items"]:
        rows.append(
            f"{entry['name'][:24]:<24} {entry['qty']:>4} "
            f"{entry['price']:>7.0f} {entry['gst_rate']:>4}% {entry['line_total']:>10.2f}"
        )

    half_gst = invoice["total_gst"] / 2
    rows.extend([
        dash,
        f"{'Subtotal':<34}{'Rs. ' + format(invoice['subtotal'], '.2f'):>20}",
        f"{'Discount (' + str(invoice['discount_percent']) + '%)':<34}{'- Rs. ' + format(invoice['discount_amount'], '.2f'):>20}",
        f"{'Taxable Value':<34}{'Rs. ' + format(invoice['taxable_amount'], '.2f'):>20}",
        f"{'CGST (50% of GST)':<34}{'Rs. ' + format(half_gst, '.2f'):>20}",
        f"{'SGST (50% of GST)':<34}{'Rs. ' + format(half_gst, '.2f'):>20}",
        dash,
        f"{'GRAND TOTAL (INR)':<34}{'Rs. ' + format(invoice['grand_total'], '.2f'):>20}",
    ])
    if invoice["payment_method"] == "Cash":
        rows.append(f"{'Cash Tendered':<34}{'Rs. ' + format(invoice['amount_tendered'], '.2f'):>20}")
        rows.append(f"{'Change Returned':<34}{'Rs. ' + format(invoice['change_due'], '.2f'):>20}")

    rows.extend([
        line,
        "Thank you for shopping with us!".center(width),
        line,
    ])
    return "\\n".join(rows)


def append_sale_to_csv(invoice):
    """Append finalized invoice summary to sales_history.csv."""
    ensure_sales_csv()
    total_qty = sum(item["qty"] for item in invoice["items"])
    with open(SALES_CSV_FILE, "a", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow([
            invoice["invoice_no"],
            invoice["timestamp"],
            invoice["customer_name"],
            invoice["customer_phone"],
            total_qty,
            f"{invoice['subtotal']:.2f}",
            invoice["discount_percent"],
            f"{invoice['discount_amount']:.2f}",
            f"{invoice['total_gst']:.2f}",
            f"{invoice['grand_total']:.2f}",
            invoice["payment_method"],
        ])


def save_receipt_file(invoice_no, receipt_text):
    """Save formatted receipt to receipts/<invoice_no>.txt."""
    os.makedirs(RECEIPTS_DIR, exist_ok=True)
    path = os.path.join(RECEIPTS_DIR, f"{invoice_no}.txt")
    with open(path, "w", encoding="utf-8") as file:
        file.write(receipt_text)
    return path


def create_new_bill(inventory):
    """Interactive billing workflow: build cart, validate stock, apply GST & save."""
    display_catalog(inventory)
    customer_name = input("\\nEnter Customer Name (or Walk-in): ").strip() or "Walk-in Customer"
    customer_phone = input("Enter Mobile Number (optional)  : ").strip() or "N/A"

    cart = {}
    while True:
        sku = input("\\nEnter Product SKU to add (or 'DONE' to checkout): ").strip().upper()
        if sku == "DONE":
            break
        product = find_product(inventory, sku)
        if not product:
            print(f"[Error] SKU '{sku}' not found. Please check the catalog.")
            continue
        if product["stock"] <= 0:
            print(f"[Error] '{product['name']}' is currently out of stock.")
            continue
        try:
            qty = int(input(f"Enter quantity for {product['name']} (Avail: {product['stock']}): "))
        except ValueError:
            print("[Error] Quantity must be a whole number.")
            continue

        already_in_cart = cart.get(product["id"], 0)
        if qty <= 0 or (qty + already_in_cart) > product["stock"]:
            print(f"[Error] Invalid quantity. Maximum available: {product['stock'] - already_in_cart}")
            continue
        cart[product["id"]] = already_in_cart + qty
        print(f"[Added] {product['name']} x {qty} added to cart.")

    if not cart:
        print("\\n[Notice] Cart is empty. Returning to main menu.")
        return

    subtotal = 0.0
    items_summary = []
    for sku, qty in cart.items():
        product = find_product(inventory, sku)
        line_sub = round(product["price"] * qty, 2)
        subtotal = round(subtotal + line_sub, 2)
        items_summary.append({
            "id": product["id"],
            "name": product["name"],
            "qty": qty,
            "price": product["price"],
            "gst_rate": product["gst_rate"],
            "line_subtotal": line_sub,
        })

    discount_pct = get_auto_discount_percent(subtotal)
    discount_amt = round((subtotal * discount_pct) / 100, 2)
    discount_factor = (subtotal - discount_amt) / subtotal if subtotal > 0 else 1.0

    total_gst = 0.0
    for entry in items_summary:
        discounted_base = entry["line_subtotal"] * discount_factor
        line_gst = round((discounted_base * entry["gst_rate"]) / 100, 2)
        entry["line_gst"] = line_gst
        entry["line_total"] = round(discounted_base + line_gst, 2)
        total_gst = round(total_gst + line_gst, 2)

    taxable_amount = round(subtotal - discount_amt, 2)
    grand_total = round(taxable_amount + total_gst, 2)

    print(f"\\nSubtotal: Rs.{subtotal:.2f} | Discount ({discount_pct}%): -Rs.{discount_amt:.2f}")
    print(f"Total GST: Rs.{total_gst:.2f} | Grand Total Payable: Rs.{grand_total:.2f}")

    mode_map = {"1": "Cash", "2": "UPI", "3": "Card"}
    mode_choice = input("Select Payment Mode [1: Cash, 2: UPI, 3: Card]: ").strip()
    payment_method = mode_map.get(mode_choice, "Cash")

    amount_tendered = grand_total
    change_due = 0.0
    if payment_method == "Cash":
        while True:
            try:
                amount_tendered = float(input(f"Enter Cash Received (>= {grand_total:.2f}): "))
                if amount_tendered < grand_total:
                    print("[Error] Cash received is less than the grand total.")
                    continue
                change_due = round(amount_tendered - grand_total, 2)
                break
            except ValueError:
                print("[Error] Please enter a valid numeric cash amount.")

    # Deduct stock and persist inventory.json
    for sku, qty in cart.items():
        product = find_product(inventory, sku)
        product["stock"] -= qty
    save_inventory(inventory)

    invoice = {
        "invoice_no": generate_next_invoice_no(),
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "customer_name": customer_name,
        "customer_phone": customer_phone,
        "items": items_summary,
        "subtotal": subtotal,
        "discount_percent": discount_pct,
        "discount_amount": discount_amt,
        "taxable_amount": taxable_amount,
        "total_gst": total_gst,
        "grand_total": grand_total,
        "payment_method": payment_method,
        "amount_tendered": amount_tendered,
        "change_due": change_due,
    }

    receipt_text = format_receipt(invoice)
    print("\\n" + receipt_text)
    append_sale_to_csv(invoice)
    saved_path = save_receipt_file(invoice["invoice_no"], receipt_text)
    print(f"\\n[Saved] Logged in {SALES_CSV_FILE} and exported receipt to {saved_path}")


def add_or_restock_product(inventory):
    """Restock an existing SKU or register a brand-new item in inventory.json."""
    sku = input("\\nEnter SKU to restock or add new (e.g., P107 or P117): ").strip().upper()
    existing = find_product(inventory, sku)
    if existing:
        try:
            add_qty = int(input(f"Current stock for {existing['name']} is {existing['stock']}. Add qty: "))
            if add_qty <= 0:
                print("[Error] Restock quantity must be positive.")
                return
            existing["stock"] += add_qty
            save_inventory(inventory)
            print(f"[Updated] {existing['name']} stock is now {existing['stock']}.")
        except ValueError:
            print("[Error] Invalid integer quantity.")
        return

    name = input("Product Name                 : ").strip()
    category = input("Category (e.g., Groceries)   : ").strip() or "Groceries"
    unit = input("Unit (e.g., 1 kg, 500 ml)    : ").strip() or "1 pcs"
    try:
        price = float(input("Unit Price (INR)             : "))
        gst_rate = int(input("GST Slab (0, 5, 12, or 18)   : "))
        stock = int(input("Opening Stock Quantity       : "))
    except ValueError:
        print("[Error] Numeric values are required for price, GST, and stock.")
        return

    if price <= 0 or gst_rate not in (0, 5, 12, 18) or stock < 0:
        print("[Error] Invalid price, GST slab, or stock value.")
        return

    inventory.append({
        "id": sku,
        "name": name,
        "category": category,
        "unit": unit,
        "price": price,
        "gst_rate": gst_rate,
        "stock": stock,
    })
    save_inventory(inventory)
    print(f"[Created] New product {sku} ({name}) saved to {INVENTORY_FILE}.")


def view_sales_history():
    """Read and display all recorded transactions from sales_history.csv."""
    ensure_sales_csv()
    with open(SALES_CSV_FILE, "r", newline="", encoding="utf-8") as file:
        rows = list(csv.DictReader(file))

    if not rows:
        print("\\n[Notice] No sales recorded in sales_history.csv yet.")
        return

    print("\\n" + "=" * 82)
    print(f"{'INVOICE':<10} {'DATE & TIME':<20} {'CUSTOMER':<18} {'ITEMS':>5} {'MODE':<6} {'TOTAL (Rs)':>12}")
    print("-" * 82)
    total_revenue = 0.0
    for row in rows:
        amt = float(row["grand_total"])
        total_revenue += amt
        print(
            f"{row['invoice_no']:<10} {row['timestamp']:<20} "
            f"{row['customer_name'][:17]:<18} {row['item_count']:>5} "
            f"{row['payment_method']:<6} {amt:>12.2f}"
        )
    print("-" * 82)
    print(f"Total Invoices: {len(rows)} | Cumulative Gross Revenue: Rs. {total_revenue:.2f}")
    print("=" * 82)


def search_bill_by_invoice():
    """Search sales_history.csv by invoice number and print stored receipt if present."""
    ensure_sales_csv()
    target = input("\\nEnter Invoice Number to search (e.g., INV-1001): ").strip().upper()
    with open(SALES_CSV_FILE, "r", newline="", encoding="utf-8") as file:
        for row in csv.DictReader(file):
            if row["invoice_no"].upper() == target:
                print("\\n--- Matching Invoice Record ---")
                for key, value in row.items():
                    print(f"{key:<18}: {value}")
                receipt_path = os.path.join(RECEIPTS_DIR, f"{target}.txt")
                if os.path.exists(receipt_path):
                    print("\\n--- Saved Thermal Receipt ---")
                    with open(receipt_path, "r", encoding="utf-8") as rf:
                        print(rf.read())
                return
    print(f"[Notice] Invoice '{target}' was not found in {SALES_CSV_FILE}.")


def main():
    """Main event loop displaying the 6-option billing management menu."""
    inventory = load_inventory()
    ensure_sales_csv()

    while True:
        print("\\n" + "=" * 48)
        print("      SHOPPING BILLING SYSTEM (01AI0302)       ")
        print("=" * 48)
        print("  1. View Product Catalog & Stock")
        print("  2. Create New Customer Bill")
        print("  3. Add New Product / Restock Inventory")
        print("  4. View Sales History (sales_history.csv)")
        print("  5. Search Bill by Invoice Number")
        print("  6. Exit Application")
        print("=" * 48)

        choice = input("Select an option (1-6): ").strip()
        if choice == "1":
            display_catalog(inventory)
        elif choice == "2":
            create_new_bill(inventory)
        elif choice == "3":
            add_or_restock_product(inventory)
        elif choice == "4":
            view_sales_history()
        elif choice == "5":
            search_bill_by_invoice()
        elif choice == "6":
            print("\\nExiting Shopping Billing System. All files saved safely.")
            break
        else:
            print("[Error] Invalid selection. Please enter a number from 1 to 6.")


if __name__ == "__main__":
    main()
`;

export const ALGORITHM_STEPS: AlgorithmStep[] = [
  {
    stepNumber: 1,
    nodeId: 'start',
    title: 'Initialize Program & Load Files',
    summary: 'Start execution, load inventory.json into memory, and verify sales_history.csv headers.',
    pythonFunction: 'load_inventory() & ensure_sales_csv()',
    details:
      'On startup, the application checks whether inventory.json exists. If missing or unreadable, it seeds the 16 default retail SKUs. It also ensures sales_history.csv contains the 11-column header schema.',
  },
  {
    stepNumber: 2,
    nodeId: 'menu',
    title: 'Display Main Menu Loop',
    summary: 'Present the 6 numbered menu actions inside a continuous while True loop until Exit.',
    pythonFunction: 'main()',
    details:
      'Prompts the operator to pick an integer option from 1 to 6: View Catalog, Create New Bill, Add/Restock Product, View Sales History, Search Invoice, or Exit. Invalid selections display an inline warning and re-prompt safely.',
  },
  {
    stepNumber: 3,
    nodeId: 'catalog',
    title: 'Display Product Catalog (Option 1)',
    summary: 'Format and print SKU, product name, category, MRP, GST slab, and live stock status.',
    pythonFunction: 'display_catalog(inventory)',
    details:
      'Iterates through the loaded product list using fixed-width f-string alignment so decimal rates and quantities align cleanly, flagging items with stock <= 10 as LOW and 0 as OUT.',
  },
  {
    stepNumber: 4,
    nodeId: 'cart_loop',
    title: 'Capture Customer & Build Cart (Option 2)',
    summary: 'Accept customer details, read SKU and quantity inputs, and guard against out-of-stock requests.',
    pythonFunction: 'create_new_bill(inventory)',
    details:
      'Loops until the operator enters DONE. Each SKU is looked up case-insensitively via find_product(). Quantities are validated as positive integers that do not exceed current stock minus already-added cart quantities.',
  },
  {
    stepNumber: 5,
    nodeId: 'tax_calc',
    title: 'Calculate Discount & Item-Wise GST',
    summary: 'Compute subtotal, apply tiered promotional discount (5% / 10%), and compute CGST + SGST.',
    pythonFunction: 'get_auto_discount_percent(subtotal)',
    details:
      'Subtotals >= ₹2,500 receive 10% discount; >= ₹1,000 receive 5%; below ₹1,000 receive 0%. Each item’s discounted base is multiplied by its GST slab (0%, 5%, 12%, or 18%) and split evenly into CGST and SGST.',
  },
  {
    stepNumber: 6,
    nodeId: 'payment',
    title: 'Process Payment & Validate Tender',
    summary: 'Select Cash, UPI, or Card; if Cash, verify received amount >= grand total and compute change.',
    pythonFunction: 'create_new_bill() — payment block',
    details:
      'Prevents underpayment by looping until cash tendered equals or exceeds the payable grand total, computing exact change due rounded to 2 decimal places.',
  },
  {
    stepNumber: 7,
    nodeId: 'persist',
    title: 'Deduct Stock, Print Receipt & Save CSV',
    summary: 'Decrement inventory.json quantities, print 54-column receipt, export .txt, and append CSV.',
    pythonFunction: 'save_inventory(), format_receipt(), append_sale_to_csv()',
    details:
      'Generates the next sequential invoice ID (INV-1004, etc.), updates stock counts atomically in inventory.json, writes a formatted receipt text file under receipts/, and appends one summary record to sales_history.csv.',
  },
  {
    stepNumber: 8,
    nodeId: 'restock',
    title: 'Add New SKU or Restock (Option 3)',
    summary: 'Increase quantity for existing SKUs or register a validated new product record.',
    pythonFunction: 'add_or_restock_product(inventory)',
    details:
      'Checks if the entered SKU already exists. If found, adds positive restock quantity; otherwise validates name, category, positive unit price, legal GST slab (0/5/12/18), and opening stock before saving to JSON.',
  },
  {
    stepNumber: 9,
    nodeId: 'history',
    title: 'View Sales Ledger & Search Invoice (Options 4 & 5)',
    summary: 'Parse sales_history.csv to report cumulative revenue or locate any bill by Invoice ID.',
    pythonFunction: 'view_sales_history() & search_bill_by_invoice()',
    details:
      'Uses csv.DictReader to tabulate all completed invoices and compute cumulative gross revenue, or retrieve a specific invoice’s metadata alongside its archived receipt text file.',
  },
  {
    stepNumber: 10,
    nodeId: 'exit',
    title: 'Graceful Exit (Option 6)',
    summary: 'Confirm all JSON and CSV files are safely persisted and terminate the main loop.',
    pythonFunction: 'main() — break',
    details:
      'Because every stock change and invoice is immediately flushed to inventory.json and sales_history.csv, exiting cleanly leaves zero unsaved transactions in memory.',
  },
];

export interface SampleIoCase {
  id: string;
  title: string;
  scenario: string;
  transcript: string;
}

export const SAMPLE_IO_TRANSCRIPTS: SampleIoCase[] = [
  {
    id: 'billing-normal',
    title: 'Test Case 1: Multi-Item Customer Billing with Tiered Discount & GST',
    scenario: 'Customer purchases 4 retail items exceeding ₹1,000, triggering 5% automatic discount, CGST/SGST calculation, and Cash payment change return.',
    transcript: `================================================
      SHOPPING BILLING SYSTEM (01AI0302)       
================================================
  1. View Product Catalog & Stock
  2. Create New Customer Bill
  3. Add New Product / Restock Inventory
  4. View Sales History (sales_history.csv)
  5. Search Bill by Invoice Number
  6. Exit Application
================================================
Select an option (1-6): 2

Enter Customer Name (or Walk-in): Rohan Sharma
Enter Mobile Number (optional)  : 9876543210

Enter Product SKU to add (or 'DONE' to checkout): P101
Enter quantity for Basmati Rice Premium (Avail: 42): 2
[Added] Basmati Rice Premium x 2 added to cart.

Enter Product SKU to add (or 'DONE' to checkout): P103
Enter quantity for Cold-Pressed Sunflower Oil (Avail: 26): 2
[Added] Cold-Pressed Sunflower Oil x 2 added to cart.

Enter Product SKU to add (or 'DONE' to checkout): P106
Enter quantity for Salted Table Butter (Avail: 14): 1
[Added] Salted Table Butter x 1 added to cart.

Enter Product SKU to add (or 'DONE' to checkout): P108
Enter quantity for Assam CTC Leaf Tea (Avail: 24): 1
[Added] Assam CTC Leaf Tea x 1 added to cart.

Enter Product SKU to add (or 'DONE' to checkout): DONE

Subtotal: Rs.1165.00 | Discount (5%): -Rs.58.25
Total GST: Rs.74.30 | Grand Total Payable: Rs.1181.05
Select Payment Mode [1: Cash, 2: UPI, 3: Card]: 1
Enter Cash Received (>= 1181.05): 1200

======================================================
                  CAMPUS FRESH MART                   
           Marwadi Campus Road, Rajkot, Gujarat       
              TAX INVOICE / RETAIL BILL               
======================================================
Invoice No : INV-1001             Mode: Cash
Date/Time  : 2026-11-18 10:15:22
Customer   : Rohan Sharma (9876543210)
------------------------------------------------------
ITEM                      QTY    RATE   GST     AMOUNT
------------------------------------------------------
Basmati Rice Premium        2     145    5%     289.28
Cold-Pressed Sunflower O    2     175    5%     349.13
Salted Table Butter         1     285   12%     303.24
Assam CTC Leaf Tea          1     240    5%     239.40
------------------------------------------------------
Subtotal                                  Rs. 1165.00
Discount (5%)                             - Rs. 58.25
Taxable Value                             Rs. 1106.75
CGST (50% of GST)                           Rs. 37.15
SGST (50% of GST)                           Rs. 37.15
------------------------------------------------------
GRAND TOTAL (INR)                         Rs. 1181.05
Cash Tendered                             Rs. 1200.00
Change Returned                             Rs. 18.95
======================================================
           Thank you for shopping with us!            
======================================================

[Saved] Logged in sales_history.csv and exported receipt to receipts/INV-1001.txt`,
  },
  {
    id: 'validation-guard',
    title: 'Test Case 2: Invalid SKU, Non-Numeric Input & Stock Cap Guard',
    scenario: 'Verifies defensive exception handling when the cashier enters a non-existent SKU, alphabetic quantity, or quantity exceeding live stock.',
    transcript: `Select an option (1-6): 2

Enter Customer Name (or Walk-in): Devanshi Trivedi
Enter Mobile Number (optional)  : 9900112233

Enter Product SKU to add (or 'DONE' to checkout): P999
[Error] SKU 'P999' not found. Please check the catalog.

Enter Product SKU to add (or 'DONE' to checkout): P116
Enter quantity for Lemon Dishwash Gel (Avail: 6): abc
[Error] Quantity must be a whole number.

Enter Product SKU to add (or 'DONE' to checkout): P116
Enter quantity for Lemon Dishwash Gel (Avail: 6): 12
[Error] Invalid quantity. Maximum available: 6

Enter Product SKU to add (or 'DONE' to checkout): P116
Enter quantity for Lemon Dishwash Gel (Avail: 6): 2
[Added] Lemon Dishwash Gel x 2 added to cart.`,
  },
  {
    id: 'restock-sku',
    title: 'Test Case 3: Restocking Existing SKU & Registering New Product',
    scenario: 'Demonstrates JSON inventory updates for both restocking a low-inventory item and appending a brand-new SKU.',
    transcript: `Select an option (1-6): 3

Enter SKU to restock or add new (e.g., P107 or P117): P116
Current stock for Lemon Dishwash Gel is 6. Add qty: 20
[Updated] Lemon Dishwash Gel stock is now 26.

Select an option (1-6): 3

Enter SKU to restock or add new (e.g., P107 or P117): P117
Product Name                 : Organic Honey Jar
Category (e.g., Groceries)   : Groceries
Unit (e.g., 1 kg, 500 ml)    : 500 g
Unit Price (INR)             : 245
GST Slab (0, 5, 12, or 18)   : 5
Opening Stock Quantity       : 15
[Created] New product P117 (Organic Honey Jar) saved to inventory.json.`,
  },
  {
    id: 'sales-search',
    title: 'Test Case 4: Reading sales_history.csv & Searching by Invoice No.',
    scenario: 'Reads historical sales directly from CSV, summarizes cumulative revenue, and looks up a single invoice record.',
    transcript: `Select an option (1-6): 4

==================================================================================
INVOICE    DATE & TIME          CUSTOMER           ITEMS MODE     TOTAL (Rs)
----------------------------------------------------------------------------------
INV-1001   2026-11-18 10:15:22  Rohan Sharma           6 UPI         1181.05
INV-1002   2026-11-18 14:42:08  Priya Joshi           11 Cash        2711.24
INV-1003   2026-11-19 09:20:45  Karan Jadeja           9 Card         642.84
----------------------------------------------------------------------------------
Total Invoices: 3 | Cumulative Gross Revenue: Rs. 4535.13
==================================================================================

Select an option (1-6): 5

Enter Invoice Number to search (e.g., INV-1001): INV-1002

--- Matching Invoice Record ---
invoice_no        : INV-1002
timestamp         : 2026-11-18 14:42:08
customer_name     : Priya Joshi
customer_phone    : 9825011223
item_count        : 11
subtotal          : 2645.00
discount_percent  : 10
discount_amount   : 264.50
total_gst         : 330.74
grand_total       : 2711.24
payment_method    : Cash`,
  },
];
