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

// Keep a rotating index in Storage so new categories cycle through the palette
const COLOR_PALETTE = DEFAULT_CATS.map(c => c.color);
let colorIndex = Storage.get("categoryColorIndex", 0);

function getNextColor() {
  const c = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];
  colorIndex++;
  Storage.set("categoryColorIndex", colorIndex);
  return c;
}

export const CategoryManager = {
  // Initialize from Storage or fall back to defaults
  list: Storage.get("customCategories", DEFAULT_CATS),

  save() {
    Storage.set("customCategories", this.list);
  },

  add(name) {
    const nm = name.trim();
    if (!nm || this.list.some(c => c.name === nm)) return false;
    this.list.push({
      name: nm,
      color: getNextColor(),
      icon: "❓"
    });
    this.save();
    return true;
  },

  rename(oldName, newName) {
    const nm = newName.trim();
    if (!nm || this.list.some(c => c.name === nm)) return false;
    this.list = this.list.map(c =>
      c.name === oldName ? { ...c, name: nm } : c
    );
    this.save();
    return true;
  },

  delete(name) {
    this.list = this.list.filter(c => c.name !== name);
    this.save();
  }
};
