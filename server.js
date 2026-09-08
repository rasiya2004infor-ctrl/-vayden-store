const express=require("express");
const session=require("express-session");
const bcrypt=require("bcryptjs");
const Database=require("better-sqlite3");
const multer=require("multer");
const path=require("path");
const fs=require("fs");

const app=express();
const PORT=process.env.PORT||3000;
const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD||"VAYDEN2026";
const SESSION_SECRET=process.env.SESSION_SECRET||"change-this-secret-before-production";

fs.mkdirSync(path.join(__dirname,"uploads"),{recursive:true});
const db=new Database(path.join(__dirname,"vayden.db"));
db.pragma("journal_mode = WAL");
db.exec(`CREATE TABLE IF NOT EXISTS products(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL, price INTEGER NOT NULL DEFAULT 0, colour TEXT DEFAULT '',
 sizes TEXT DEFAULT '', stock INTEGER NOT NULL DEFAULT 0, image TEXT DEFAULT '',
 created_at TEXT DEFAULT CURRENT_TIMESTAMP
)`);
const count=db.prepare("SELECT COUNT(*) c FROM products").get().c;
if(!count){
 const ins=db.prepare("INSERT INTO products(name,price,colour,sizes,stock,image) VALUES(?,?,?,?,?,?)");
 [
  ["Premium Polo VAYDEN — Green",2990,"Green","S, M, L, XL, XXL",20,"/premium-polo-green.jpeg"],
  ["Premium Polo VAYDEN — White",2990,"White","S, M, L, XL, XXL",20,"/premium-polo-white.jpeg"],
  ["Premium Polo VAYDEN — Burgundy",2990,"Burgundy","S, M, L, XL, XXL",20,"/premium-polo-burgundy.jpeg"],
  ["Premium Polo VAYDEN — Black",2990,"Black","S, M, L, XL, XXL",20,"/premium-polo-black.jpeg"]
 ].forEach(x=>ins.run(...x));
}

app.use(express.json({limit:"1mb"}));
app.use(express.urlencoded({extended:true}));
app.use(session({secret:SESSION_SECRET,resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:8*60*60*1000}}));

const storage=multer.diskStorage({
 destination:(req,file,cb)=>cb(null,path.join(__dirname,"uploads")),
 filename:(req,file,cb)=>{
  const ext=path.extname(file.originalname).toLowerCase();
  cb(null,Date.now()+"-"+Math.random().toString(36).slice(2,8)+ext);
 }
});
const upload=multer({storage,limits:{fileSize:8*1024*1024},fileFilter:(req,file,cb)=>cb(null,/^image\/(jpeg|png|webp)$/.test(file.mimetype))});

function auth(req,res,next){if(req.session.admin)return next();res.status(401).json({error:"Unauthorized"});}
app.use(express.static(path.join(__dirname,"public")));
app.use("/uploads",express.static(path.join(__dirname,"uploads")));

app.get("/api/products",(req,res)=>res.json(db.prepare("SELECT * FROM products ORDER BY id DESC").all()));
app.post("/api/login",(req,res)=>{
 if(req.body.password!==ADMIN_PASSWORD)return res.status(401).json({error:"Incorrect password"});
 req.session.admin=true;res.json({ok:true});
});
app.post("/api/logout",(req,res)=>req.session.destroy(()=>res.json({ok:true})));
app.get("/api/me",(req,res)=>res.json({admin:!!req.session.admin}));

app.post("/api/products",auth,upload.single("image"),(req,res)=>{
 const {name,price,colour,sizes,stock}=req.body;
 if(!name?.trim())return res.status(400).json({error:"Product name is required"});
 const image=req.file?"/uploads/"+req.file.filename:(req.body.image||"");
 const r=db.prepare("INSERT INTO products(name,price,colour,sizes,stock,image) VALUES(?,?,?,?,?,?)")
  .run(name.trim(),Number(price)||0,colour||"",sizes||"",Math.max(0,Number(stock)||0),image);
 res.json(db.prepare("SELECT * FROM products WHERE id=?").get(r.lastInsertRowid));
});
app.put("/api/products/:id",auth,upload.single("image"),(req,res)=>{
 const old=db.prepare("SELECT * FROM products WHERE id=?").get(req.params.id);
 if(!old)return res.status(404).json({error:"Product not found"});
 const image=req.file?"/uploads/"+req.file.filename:(req.body.image||old.image);
 db.prepare("UPDATE products SET name=?,price=?,colour=?,sizes=?,stock=?,image=? WHERE id=?")
  .run((req.body.name||old.name).trim(),Number(req.body.price??old.price)||0,req.body.colour??old.colour,req.body.sizes??old.sizes,Math.max(0,Number(req.body.stock??old.stock)||0),image,req.params.id);
 res.json(db.prepare("SELECT * FROM products WHERE id=?").get(req.params.id));
});
app.delete("/api/products/:id",auth,(req,res)=>{
 const old=db.prepare("SELECT * FROM products WHERE id=?").get(req.params.id);
 if(!old)return res.status(404).json({error:"Product not found"});
 db.prepare("DELETE FROM products WHERE id=?").run(req.params.id);
 if(old.image?.startsWith("/uploads/")){try{fs.unlinkSync(path.join(__dirname,old.image.slice(9)))}catch{}}
 res.json({ok:true});
});

app.get("/",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.get("/admin",(req,res)=>res.sendFile(path.join(__dirname,"public","admin.html")));
app.listen(PORT,()=>console.log("VAYDEN running on port "+PORT));
