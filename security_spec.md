# Security Specification (TDD) for Aronee's Footwear

## 1. Data Invariants
- **Product Validity**: Every product must have a name (string <= 100 chars), price (positive integer), category reference (must exists), stock (integer >= 0), isFeatured (boolean), status (active, draft, or out_of_stock), images array (1 to 10 strings), and timestamp fields.
- **Category Validity**: Every category must have a name, cover image URL, and positive product count.
- **Admin Isolation**: Only authenticated, verified administrators can read and write `admins` collection.
- **Authorized Operations**:
  - Non-authenticated/Public: Can ONLY `get`/`list` active (publicly visible) products, categories, and settings. No write permissions.
  - Authorized Admin: Can read/write everything in products, categories, settings, and admins.

---

## 2. The "Dirty Dozen" Exploitation Payloads
Here are the 12 specific payloads designed to break our data models:

1. **Anonymous Write to Products**: An unauthenticated user attempts to create a product.
   - *Expectation*: `PERMISSION_DENIED`
2. **Admin Spoofing (Write Admins)**: A default logged-in user tries to add themselves to `/admins/` database.
   - *Expectation*: `PERMISSION_DENIED`
3. **Price Manipulation**: An admin or spoofed client tries to set a negative price value: `price: -100`.
   - *Expectation*: `PERMISSION_DENIED` (Strict schema fails)
4. **ID Poisoning Attack**: An attacker tries to write to products with a document ID of 1.5KB special character length to increase billing fees.
   - *Expectation*: `PERMISSION_DENIED` (due to `isValidId` check)
5. **Immortality Bypass**: A user tries to edit the `createdAt` timestamp of an existing product.
   - *Expectation*: `PERMISSION_DENIED`
6. **Ghost fields injection**: A user attempts to add an un-whitelisted field `discountCode: "FREEFREE"` in a product.
   - *Expectation*: `PERMISSION_DENIED` (affectedKeys or strict keys check blocks this)
7. **Bypassing Verification**: A logged-in user with `email_verified: false` tries to access Admin features.
   - *Expectation*: `PERMISSION_DENIED`
8. **Malicious Empty Images Array**: Creating a product with `images: []` to break Frontend sliders.
   - *Expectation*: `PERMISSION_DENIED` (at least 1 image requirement)
9. **Image String Poisoning**: Creating a product where the image list elements are numbers or nulls instead of strings.
   - *Expectation*: `PERMISSION_DENIED`
10. **State Skipping (Immediate Out-of-Stock bypass)**: A non-admin trying to update product status to "out_of_stock" directly via client SDK.
    - *Expectation*: `PERMISSION_DENIED`
11. **Negative Stock Manipulation**: A stock update resulting in inventory count of `-50`.
    - *Expectation*: `PERMISSION_DENIED` (stock must be >= 0)
12. **Blanket Query Scraping**: A client attempts to perform a full blanket list query without filters, bypassing active status.
    - *Expectation*: `PERMISSION_DENIED` unless filtered or admin.

---

## 3. Test Cases Configuration
All of these will be handled and proven denied by running the Firebase security rules.
