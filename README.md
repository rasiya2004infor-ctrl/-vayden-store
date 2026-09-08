# VAYDEN Online Store

Real server-backed starter for VAYDEN Clothing.

## Run
1. Install Node.js 20+.
2. In this folder run `npm install`.
3. Set a strong `ADMIN_PASSWORD` and `SESSION_SECRET`.
4. Run `npm start`.
5. Store: `/`
6. Admin: `/admin`

The server uses SQLite for products and a server-side session for admin login. Product images uploaded through Admin are stored in `uploads/`.

## Production
Use HTTPS and set:
- `NODE_ENV=production`
- `ADMIN_PASSWORD=<strong unique password>`
- `SESSION_SECRET=<long random secret>`

For a production launch, use a persistent disk/volume for `vayden.db` and `uploads/`, or move the database/image storage to managed services. The included WhatsApp button is intentionally generic; replace the WhatsApp destination with the VAYDEN business number before launch.
