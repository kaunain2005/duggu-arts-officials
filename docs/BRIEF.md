//docs/BRIEF.md
# Project: Handmade Flower & Craft E-commerce Website

I want you to act as a Senior Full-Stack Software Architect, UI/UX Designer and E-commerce Product Engineer.

I am building a complete e-commerce website for my small handmade flower and craft business. I want you to understand my business requirements and design the best technical architecture for it.

I have already created a fresh Next.js project using the latest version.

Your responsibility is to make the important technical decisions, including application architecture, folder structure, routing, database design, authentication flow, API design and development strategy.

Do not blindly follow a predefined architecture. Evaluate my requirements and recommend the most suitable, modern, secure and maintainable solution.

## 1. About my business

I am starting a handmade business focused primarily on pipe-cleaner flowers and bouquets.

My initial products include:
- Handmade roses.
- Tulips.
- Daisies.
- Other handmade flowers.
- Individual flowers.
- Handmade bouquets in different sizes.
- Customized flower arrangements.
- Personalized gifts.

In the future, I may expand into acrylic paintings, greeting cards and other handmade crafts.

The website should communicate creativity, craftsmanship, thoughtful gifting and a premium handmade experience.

The business is currently at an early stage, so the website should be practical for a small business but flexible enough to grow.

## 2. Preferred technology stack

My preferred technologies are:

- Next.js – latest stable version.
- React – compatible latest stable version.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- Lucide icons.
- Firebase Authentication.
- Cloud Firestore.
- Firebase Admin SDK.
- Cloudinary for image hosting.

You may recommend additional technologies or free services if they genuinely improve the application.

### Dependency requirements

- Use the latest stable versions available when implementation begins.
- Verify official documentation and compatibility.
- Avoid deprecated packages and outdated implementation patterns.
- Avoid unnecessary dependencies.
- Prefer modern Next.js App Router conventions.
- Use TypeScript properly.
- Explain why each additional dependency is necessary.

I have already initialized my Next.js project. Do not assume that I am starting from an empty directory. First inspect the installed project and its actual versions.

## 3. Strict budget requirements

I want to build and operate this website using free services wherever possible.

My preferred services are Firebase and Cloudinary.

You may recommend other genuinely free services if required.

Requirements:
- No Google Sheets or Google Apps Script.
- No Google Drive image storage.
- No Firebase Storage.
- No mandatory paid database.
- No mandatory paid authentication service.
- No mandatory paid image-hosting service.
- No mandatory paid email service.
- No mandatory paid payment gateway.

Evaluate Firebase Spark, Cloudinary Free and suitable free hosting options.

Verify current quotas, commercial-use restrictions, limitations and potential costs.

Do not promise unlimited free usage. Clearly identify features that may eventually require payment.

## 4. Customer-facing website

I want a complete, attractive online store.

The website should include:

- Homepage.
- Shop page.
- Product category pages.
- Individual product detail pages.
- Product search.
- Product filtering and sorting.
- Shopping cart.
- Checkout.
- Custom order request page.
- Reviews.
- About us.
- Contact.
- FAQ.
- Shipping and return policies.
- Privacy policy and terms.

Customers should be able to:
- Browse products.
- View product galleries.
- Select product variants.
- Choose bouquet sizes.
- Select quantities.
- Add products to cart.
- Update or remove cart items.
- Save wishlist products.
- Submit orders.
- Track order status.
- Submit reviews.
- Request customized products.

The product system should support different variants, such as single flowers and bouquets of 3, 5 or 10 flowers, with configurable prices.

## 5. WhatsApp-based checkout – VERY IMPORTANT

I want WhatsApp to be the primary order-confirmation channel initially.

I do not want to integrate a paid payment gateway at the beginning.

The customer checkout journey should work as follows:

1. Customer browses the store.
2. Customer adds products to the shopping cart.
3. Customer opens the checkout page.
4. Customer enters their details:
   - Full name.
   - Phone number.
   - Email (optional if appropriate).
   - Delivery address.
   - City.
   - State.
   - PIN code.
   - Delivery instructions (optional).
5. The checkout page displays a complete order summary:
   - Product names.
   - Selected variants.
   - Quantities.
   - Individual prices.
   - Subtotal.
   - Shipping charges.
   - Discounts, if applicable.
   - Final total.
6. Customer clicks a button such as **"Place Order on WhatsApp"**.
7. The website opens WhatsApp with a prefilled message addressed to my business WhatsApp number.

The prefilled WhatsApp message should contain the complete cart and delivery information in a readable format.

Example:

Hello! I would like to place an order.

Customer Details:
Name: Customer Name
Phone: Customer Phone

Delivery Address:
Full delivery address

Order Details:
1. Handmade Rose – Red – Quantity: 2 – ₹100 each
2. Tulip Bouquet – 5 Flowers – Quantity: 1 – ₹450

Subtotal: ₹650
Shipping: ₹50
Total: ₹700

Please confirm my order. Thank you!

The WhatsApp button should use an appropriate WhatsApp click-to-chat URL with a URL-encoded message.

My business WhatsApp number should be configurable through environment variables or admin settings.

### Order handling

Do not rely solely on WhatsApp to store orders.

Design a reliable approach where the application:
- Validates the cart and customer details on the server.
- Recalculates prices on the server.
- Checks product availability and stock.
- Creates a pending order record in Firestore.
- Generates an order reference.
- Provides the WhatsApp message containing the order reference and full order summary.
- Opens WhatsApp for the customer to send the message.
- Allows the admin to confirm the order after receiving the WhatsApp message.

Clearly distinguish:
- Order submitted to the website.
- WhatsApp message sent by the customer.
- Order confirmed by the business.
- Payment received and verified.

Do not falsely mark an order as confirmed or paid simply because the WhatsApp link was opened.

Important security requirement: Never include credit/debit card numbers, CVV, passwords, OTPs or payment credentials in WhatsApp messages or Firestore order records.

If WhatsApp message sending cannot be confirmed automatically using a simple click-to-chat link, explain that limitation.

## 6. Authentication and customer profiles

Use Firebase Authentication.

Support:
- Email/password registration.
- Email/password login.
- Direct Google sign-in.
- Email verification.
- Forgot password.
- Password reset.
- Logout.
- Account profile management.

A Google-authenticated customer should be able to link an email/password provider to the same Firebase UID without creating a duplicate account.

Customer profile should include:
- Name.
- Email.
- Profile image.
- Phone number.
- Saved delivery addresses.
- Account creation date.
- Authentication providers.

Customers should have their own account dashboard where they can view:
- Profile.
- Addresses.
- Orders.
- Order details.
- Wishlist.
- Reviews.

## 7. Admin dashboard

I need a complete admin dashboard to manage the entire business.

Admin should have secure access separate from normal customers.

The dashboard should include:

### Overview
- Total orders.
- Total revenue.
- Total customers.
- Total products.
- Pending orders.
- Confirmed orders.
- Completed orders.
- Low-stock products.
- Recent orders.
- Best-selling products.

### Product management
Full CRUD:
- Create products.
- View products.
- Edit products.
- Delete or archive products.
- Manage prices.
- Manage variants.
- Manage product descriptions.
- Manage stock.
- Manage product categories.
- Upload multiple images.
- Publish/unpublish products.
- Set featured products.

### Category management
Full CRUD for product categories.

### Order management
- View all orders.
- View order details.
- Search and filter orders.
- Confirm orders.
- Update order statuses.
- Update payment status.
- Add internal notes.
- Manage delivery information.
- Cancel orders.

Possible statuses:
- Pending.
- Awaiting confirmation.
- Confirmed.
- Preparing.
- Ready to ship.
- Shipped.
- Delivered.
- Cancelled.

### Inventory management
- View stock.
- Add stock.
- Reduce stock.
- Adjust stock.
- View stock movement history.
- Low-stock alerts.

### Customer management
- View customers.
- Search customers.
- View profiles.
- View order history.
- View spending summaries.

### Reviews management
- View reviews.
- Approve or reject reviews.
- Delete inappropriate reviews.
- Manage visibility.

### Custom orders
Customers should be able to submit custom bouquet requests, including preferences, colours, quantity, budget, delivery date and optional reference images.

Admin should manage these requests and update their statuses.

### Store settings
Admin should be able to manage:
- Business contact details.
- WhatsApp number.
- Social media links.
- Shipping charges.
- Minimum order amount.
- Low-stock threshold.
- Store availability.
- Featured products.
- Store policies.

## 8. Cloudinary image management

Use Cloudinary Free for:
- Product images.
- Product gallery images.
- Category images.
- Custom-order reference images.

Design a secure image upload architecture.

Requirements:
- Server-side signed uploads.
- Image validation.
- Multiple image support.
- Image optimization.
- Image deletion.
- Store Cloudinary URLs and public IDs in Firestore.
- Never expose Cloudinary API secrets to the browser.
- Do not delete images that are still referenced by other records.

## 9. Database and backend

Use Cloud Firestore as the primary database.

Design the database based on the application's actual requirements.

Consider collections for:
- Users.
- Products.
- Categories.
- Orders.
- Inventory.
- Inventory movements.
- Reviews.
- Custom requests.
- Settings.
- Wishlists.

You decide the final structure, relationships, document IDs, indexes and access patterns.

Plan the complete backend API architecture using appropriate Next.js Route Handlers and server-side services.

All required CRUD operations must be supported.

Use Zod or another appropriate validation solution.

Use Firestore transactions where needed for stock and order consistency.

## 10. Security requirements

Security is extremely important.

Design the application with:
- Server-side Firebase session verification.
- Secure HTTP-only cookies.
- CSRF protection.
- Server-side admin authorization.
- `requireAuth()` and `requireAdmin()` utilities.
- Firestore deny-by-default security rules.
- Customer ownership checks.
- Input validation.
- Upload validation.
- Rate limiting using a free-compatible approach.
- Secure environment-variable management.
- No secrets exposed to client bundles.
- Server-side pricing and stock validation.
- Protection against duplicate order submissions.

Remember that Firebase Admin SDK bypasses Firestore security rules. Every server-side API must independently validate permissions.

Do not import Firebase Admin SDK into Edge middleware.

Include a security review and testing strategy.

## 11. UI/UX direction

I want a professional, aesthetic and premium handmade flower boutique.

Design direction:
- Soft pastel floral aesthetic.
- Elegant typography.
- Beautiful product photography.
- Clean whitespace.
- Subtle animations.
- Responsive layouts.
- Mobile-first experience.
- Professional product cards.
- Smooth shopping experience.

Theme options:
- White theme as default.
- Dark theme.
- Soft pink theme.

Avoid a childish or overly cluttered design.

The admin dashboard should have a professional layout with sidebar navigation, data tables, forms, charts, filters and clear status indicators.

## 12. What I expect from you

I am not prescribing the architecture or folder structure because I want you to make those decisions.

Analyze my requirements and deliver:

1. Recommended technical architecture.
2. Complete Next.js folder structure.
3. Application route map.
4. Firestore database schema.
5. Authentication architecture.
6. Backend API design.
7. WhatsApp checkout workflow.
8. Cloudinary image workflow.
9. Admin dashboard architecture.
10. Customer account architecture.
11. Security architecture.
12. UI/UX design direction.
13. Free-tier service evaluation.
14. Recommended dependency list with latest stable compatible versions.
15. Complete development roadmap divided into phases.

For each phase, provide objectives, implementation order, dependencies, acceptance criteria and testing requirements.

## 13. How to work

First inspect my existing Next.js project.

Check:
- Installed Next.js version.
- React version.
- Node.js version.
- Package manager.
- Existing dependencies.
- Existing files and configuration.

Verify current official documentation for important technologies.

Make architectural decisions based on the actual project and current stable versions.

Do not:
- Generate code yet.
- Install packages yet.
- Modify files.
- Assume old project files exist.
- Introduce unnecessary complexity.
- Recommend mandatory paid services.

I want a complete, realistic architecture for a small business that can grow over time.
