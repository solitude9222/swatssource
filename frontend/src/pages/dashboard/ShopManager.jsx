import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, fileUrl } from "@/lib/api";
import { toast } from "@/lib/notify";
import {
  Store, ShoppingBag, Plus, Trash2, Edit3, Save, X, Upload, Image as ImageIcon,
  Loader2, DollarSign, Package, Tag, FileText, Eye, EyeOff, ToggleLeft, ToggleRight,
  AlertTriangle, CheckCircle2, Lock, Sparkles,
} from "lucide-react";
import { PremiumGate } from "@/components/ui-shared/PremiumGate";

export default function ShopManager() {
  const { user } = useAuth();
  const isPremium = user?.tier === "premium" || user?.tier === "admin" || !!user?.is_owner;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [storeEnabled, setStoreEnabled] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // New product form state
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    tag: "",
    stock: "Direct / Digital",
    image_url: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/me");
      const profile = data.profile || {};
      setProducts(Array.isArray(profile.shop_items) ? profile.shop_items : []);
      setStoreEnabled(profile.store_enabled !== false);
    } catch (e) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStore = async () => {
    setSaving(true);
    try {
      await api.put("/me/profile", { store_enabled: !storeEnabled });
      setStoreEnabled(!storeEnabled);
      toast.success(storeEnabled ? "Store paused" : "Store activated");
    } catch (e) {
      toast.error("Failed to toggle store");
    } finally {
      setSaving(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.title.trim()) {
      toast.error("Product title is required");
      return;
    }

    setSaving(true);
    try {
      const product = {
        id: `prod_${Date.now()}`,
        ...newProduct,
        created_at: new Date().toISOString(),
      };

      const updatedProducts = [...products, product];
      await api.put("/me/profile", { shop_items: updatedProducts });

      setProducts(updatedProducts);
      setNewProduct({
        title: "",
        description: "",
        price: "",
        category: "",
        tag: "",
        stock: "Direct / Digital",
        image_url: "",
      });
      setShowAddForm(false);
      toast.success("Product added successfully!");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to add product");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    setSaving(true);
    try {
      const updatedProducts = products.map((p) =>
        p.id === editingProduct.id ? editingProduct : p
      );
      await api.put("/me/profile", { shop_items: updatedProducts });

      setProducts(updatedProducts);
      setEditingProduct(null);
      toast.success("Product updated!");
    } catch (e) {
      toast.error("Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    setSaving(true);
    try {
      const updatedProducts = products.filter((p) => p.id !== productId);
      await api.put("/me/profile", { shop_items: updatedProducts });

      setProducts(updatedProducts);
      toast.success("Product removed");
    } catch (e) {
      toast.error("Failed to delete product");
    } finally {
      setSaving(false);
    }
  };

  if (!isPremium) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white">
              My Products
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Manage your creator storefront and product listings.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
          <div className="h-16 w-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-5">
            <Lock className="h-8 w-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Premium Feature</h2>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mb-6">
            Unlock your personal storefront to sell products, offer services, and manage direct transactions with your audience.
          </p>
          <a
            href="/!/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#b4bffa] text-black font-bold text-sm hover:brightness-110 transition"
          >
            <Sparkles className="w-4 h-4" />
            Upgrade to Premium
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500 font-mono2 text-xs">
        <Loader2 className="w-4 h-4 animate-spin mr-2 text-[#b4bffa]" /> Loading your products…
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white">
            My Products
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Upload and manage products for your creator storefront at tourn.lol/{user?.username}/shop
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleStore}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              storeEnabled
                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/15 border border-rose-500/30 text-rose-400"
            }`}
          >
            {storeEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            {storeEnabled ? "Store Active" : "Store Paused"}
          </button>

          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#b4bffa] text-black font-bold text-xs hover:brightness-110 transition"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Store Status Banner */}
      {!storeEnabled && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="text-xs text-rose-200">
            Your storefront is currently paused. Buyers cannot see your products. Toggle it back on when ready.
          </div>
        </div>
      )}

      {/* Add Product Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-[#0e0e12] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-[#b4bffa]" />
                Add New Product
              </h3>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                  placeholder="e.g. Custom Discord Bot"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#b4bffa]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Describe what you're offering..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#b4bffa] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    <DollarSign className="w-3 h-3 inline mr-1" />
                    Price
                  </label>
                  <input
                    type="text"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="$25 or Negotiable"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#b4bffa]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    <Tag className="w-3 h-3 inline mr-1" />
                    Category
                  </label>
                  <input
                    type="text"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    placeholder="Service, Digital, etc."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#b4bffa]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Tag / Badge
                  </label>
                  <input
                    type="text"
                    value={newProduct.tag}
                    onChange={(e) => setNewProduct({ ...newProduct, tag: e.target.value })}
                    placeholder="Featured, New, etc."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#b4bffa]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Delivery
                  </label>
                  <input
                    type="text"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    placeholder="Direct / Digital"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#b4bffa]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  <ImageIcon className="w-3 h-3 inline mr-1" />
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  value={newProduct.image_url}
                  onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                  placeholder="https://example.com/image.png"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#b4bffa]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#b4bffa] text-black font-bold text-xs hover:brightness-110 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-[#0e0e12] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#b4bffa]" />
                Edit Product
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Product Title
                </label>
                <input
                  type="text"
                  value={editingProduct.title}
                  onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm text-white outline-none focus:border-[#b4bffa]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm text-white outline-none focus:border-[#b4bffa] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Price</label>
                  <input
                    type="text"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm text-white outline-none focus:border-[#b4bffa]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Category</label>
                  <input
                    type="text"
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm text-white outline-none focus:border-[#b4bffa]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Tag</label>
                  <input
                    type="text"
                    value={editingProduct.tag}
                    onChange={(e) => setEditingProduct({ ...editingProduct, tag: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm text-white outline-none focus:border-[#b4bffa]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Delivery</label>
                  <input
                    type="text"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm text-white outline-none focus:border-[#b4bffa]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateProduct}
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#b4bffa] text-black font-bold text-xs hover:brightness-110 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-5 flex flex-col justify-between hover:border-white/20 transition-all duration-200 shadow-xl group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    {product.tag && (
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold font-mono2 uppercase bg-[#b4bffa]/15 text-[#b4bffa] border border-[#b4bffa]/30">
                        {product.tag}
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-white">{product.title}</h3>
                  </div>
                  <span className="text-base font-extrabold text-white font-mono2 shrink-0">
                    {product.price ? (product.price.startsWith("$") ? product.price : `$${product.price}`) : "Inquire"}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                  {product.description || "No description provided"}
                </p>

                {product.category && (
                  <span className="text-[10px] text-zinc-500 font-mono2">
                    Category: {product.category}
                  </span>
                )}
              </div>

              <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 font-mono2">
                  {product.stock || "Direct / Digital"}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(product)}
                    className="p-2 rounded-xl bg-white/[0.06] hover:bg-[#b4bffa] hover:text-black text-zinc-400 transition"
                    title="Edit product"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(product.id)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition"
                    title="Delete product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-[#0c0c0e]/60 p-16 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
            <Package className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-white">No Products Yet</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Add your first product to start selling through your storefront at tourn.lol/{user?.username}/shop
          </p>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#b4bffa] text-black font-bold text-xs hover:brightness-110 transition"
          >
            <Plus className="w-4 h-4" />
            Add Your First Product
          </button>
        </div>
      )}

      {/* Store Link */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-xs text-zinc-400">
          <Store className="w-4 h-4 text-[#b4bffa]" />
          <span>
            Your storefront: <a href={`/${user?.username}/shop`} className="text-[#b4bffa] font-mono2 hover:underline" target="_blank" rel="noreferrer">tourn.lol/{user?.username}/shop</a>
          </span>
        </div>
        <a
          href={`/${user?.username}/shop`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-zinc-500 hover:text-white flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" />
          Preview
        </a>
      </div>
    </div>
  );
}
