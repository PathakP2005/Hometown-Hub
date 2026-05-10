import React, { useState, useEffect } from "react";

function ContentManagement() {
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [newTag, setNewTag] = useState("");
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showTagForm, setShowTagForm] = useState(false);

  useEffect(() => {
    // Load categories and tags from localStorage
    const storedCategories = JSON.parse(
      localStorage.getItem("contentCategories") || '["Events", "News", "Local Business", "Entertainment", "Sports", "Food"]'
    );
    const storedTags = JSON.parse(
      localStorage.getItem("contentTags") || '["community", "local", "trending", "popular", "event", "announcement"]'
    );
    setCategories(storedCategories);
    setTags(storedTags);
  }, []);

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      localStorage.setItem(
        "contentCategories",
        JSON.stringify(updatedCategories)
      );
      setNewCategory("");
      setShowCategoryForm(false);
      alert("Category added successfully!");
    }
  };

  const handleDeleteCategory = (index) => {
    const updatedCategories = categories.filter((_, i) => i !== index);
    setCategories(updatedCategories);
    localStorage.setItem(
      "contentCategories",
      JSON.stringify(updatedCategories)
    );
    alert("Category deleted!");
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      const updatedTags = [...tags, newTag];
      setTags(updatedTags);
      localStorage.setItem("contentTags", JSON.stringify(updatedTags));
      setNewTag("");
      setShowTagForm(false);
      alert("Tag added successfully!");
    }
  };

  const handleDeleteTag = (index) => {
    const updatedTags = tags.filter((_, i) => i !== index);
    setTags(updatedTags);
    localStorage.setItem("contentTags", JSON.stringify(updatedTags));
    alert("Tag deleted!");
  };

  return (
    <div className="admin-section">
      <h2>🏷️ Content Categories & Tags</h2>

      <div className="content-management-grid">
        {/* Categories Section */}
        <div className="management-subsection">
          <h3>Categories</h3>
          <button
            className="btn-add"
            onClick={() => setShowCategoryForm(!showCategoryForm)}
          >
            {showCategoryForm ? "✕ Cancel" : "+ Add Category"}
          </button>

          {showCategoryForm && (
            <div className="form-group">
              <input
                type="text"
                placeholder="Enter category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <button className="btn-submit" onClick={handleAddCategory}>
                Add
              </button>
            </div>
          )}

          <div className="items-list">
            {categories.length === 0 ? (
              <p className="empty-state">No categories found.</p>
            ) : (
              categories.map((category, index) => (
                <div key={index} className="item-row">
                  <span>{category}</span>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteCategory(index)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tags Section */}
        <div className="management-subsection">
          <h3>Tags</h3>
          <button
            className="btn-add"
            onClick={() => setShowTagForm(!showTagForm)}
          >
            {showTagForm ? "✕ Cancel" : "+ Add Tag"}
          </button>

          {showTagForm && (
            <div className="form-group">
              <input
                type="text"
                placeholder="Enter tag name"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
              />
              <button className="btn-submit" onClick={handleAddTag}>
                Add
              </button>
            </div>
          )}

          <div className="items-list">
            {tags.length === 0 ? (
              <p className="empty-state">No tags found.</p>
            ) : (
              tags.map((tag, index) => (
                <div key={index} className="item-row tag-item">
                  <span className="tag-badge">#{tag}</span>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteTag(index)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="management-info">
        <h4>Total Statistics</h4>
        <p>Total Categories: <strong>{categories.length}</strong></p>
        <p>Total Tags: <strong>{tags.length}</strong></p>
      </div>
    </div>
  );
}

export default ContentManagement;
