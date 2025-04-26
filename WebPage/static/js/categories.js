

// categories.js
import { Storage } from './storage.js';

const DEFAULT_CATS = [
  { name:"Travel", color:"#ff6384", icon:"✈️" },
  { name:"Car",    color:"#36a2eb", icon:"🚗" },
  { name:"Rent",   color:"#ffcd56", icon:"🏠" },
  { name:"Shops",  color:"#4bc0c0", icon:"🛍️" },
  { name:"Food and Groceries", color:"#9966ff", icon:"🛒" },
  { name:"Education", color:"#ff9f40", icon:"🎓" }
];

export const CategoryManager = {
  list: Storage.get("customCategories", DEFAULT_CATS),
  save() { Storage.set("customCategories", this.list); },
  add(cat)    { this.list.push(cat); this.save(); },
  rename(o,n) { this.list = this.list.map(c=>c.name===o?{...c,name:n}:c); this.save(); },
  delete(n)   { this.list = this.list.filter(c=>c.name!==n); this.save(); }
};
