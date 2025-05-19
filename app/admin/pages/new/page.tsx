'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSave, FaTimes, FaArrowLeft, FaPlus, FaTrash, FaImage, FaCode } from 'react-icons/fa';
import Link from 'next/link';

// Section types for the page builder
const SECTION_TYPES = [
  { id: 'heading', label: 'Heading', icon: <span className="text-lg font-bold">H</span> },
  { id: 'text', label: 'Text Block', icon: <span className="text-lg">¶</span> },
  { id: 'image', label: 'Image', icon: <FaImage /> },
  { id: 'columns', label: '2 Columns', icon: <span className="text-sm">⫴</span> },
  { id: 'callout', label: 'Callout Box', icon: <span className="text-sm">!</span> },
  { id: 'code', label: 'Code Block', icon: <FaCode /> },
];

const NewPagePage = () => {
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [sections, setSections] = useState([
    // Default empty heading section
    { id: 1, type: 'heading', content: '', level: 'h1' }
  ]);
  const [nextSectionId, setNextSectionId] = useState(2);
  const [isPublished, setIsPublished] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Auto-generate slug from title
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    // Auto-generate slug if user hasn't manually changed it
    const generatedSlug = newTitle
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');
    
    setSlug(generatedSlug);
  };
  
  // Add a new section
  const addSection = (type) => {
    const newSection = {
      id: nextSectionId,
      type,
      content: '',
    };
    
    // Add default properties based on section type
    if (type === 'heading') {
      newSection.level = 'h2';
    } else if (type === 'image') {
      newSection.src = '';
      newSection.alt = '';
      newSection.caption = '';
    } else if (type === 'columns') {
      newSection.leftContent = '';
      newSection.rightContent = '';
    } else if (type === 'callout') {
      newSection.style = 'info';
    }
    
    setSections([...sections, newSection]);
    setNextSectionId(nextSectionId + 1);
  };
  
  // Remove a section
  const removeSection = (id) => {
    setSections(sections.filter(section => section.id !== id));
  };
  
  // Update section content
  const updateSection = (id, updates) => {
    setSections(sections.map(section => 
      section.id === id ? { ...section, ...updates } : section
    ));
  };
  
  // Move section up or down
  const moveSection = (id, direction) => {
    const index = sections.findIndex(section => section.id === id);
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === sections.length - 1)) {
      return; // Can't move beyond boundaries
    }
    
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap positions
    [newSections[index], newSections[targetIndex]] = 
    [newSections[targetIndex], newSections[index]];
    
    setSections(newSections);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      // Basic validation
      if (!title || !slug) {
        throw new Error('Title and URL slug are required.');
      }
      
      // Ensure slug is valid
      if (!/^[a-z0-9-]+$/.test(slug)) {
        throw new Error('URL slug can only contain lowercase letters, numbers, and hyphens.');
      }
      
      // Check for empty sections
      const emptySections = sections.filter(section => {
        if (section.type === 'text' || section.type === 'heading') {
          return !section.content;
        }
        if (section.type === 'image') {
          return !section.src;
        }
        if (section.type === 'columns') {
          return !section.leftContent && !section.rightContent;
        }
        if (section.type === 'callout' || section.type === 'code') {
          return !section.content;
        }
        return false;
      });
      
      if (emptySections.length > 0) {
        throw new Error('Please fill in all section content or remove empty sections.');
      }
      
      // Prepare the page data
      const pageData = {
        title,
        slug,
        metaDescription,
        sections,
        isPublished,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      console.log('Saving page:', pageData);
      
      // Mock successful save
      setTimeout(() => {
        router.push('/admin/pages');
      }, 1000);
      
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };
  
  // Render different section editors based on type
  const renderSectionEditor = (section) => {
    switch (section.type) {
      case 'heading':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <select
                value={section.level}
                onChange={(e) => updateSection(section.id, { level: e.target.value })}
                className="bg-dark border border-gray-700 rounded-lg px-2 py-1 text-white text-sm focus:border-primary focus:outline-none"
              >
                <option value="h1">Heading 1 (Large)</option>
                <option value="h2">Heading 2 (Medium)</option>
                <option value="h3">Heading 3 (Small)</option>
              </select>
            </div>
            
            <input
              type="text"
              value={section.content}
              onChange={(e) => updateSection(section.id, { content: e.target.value })}
              placeholder="Enter heading text..."
              className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
            />
          </div>
        );
        
      case 'text':
        return (
          <textarea
            value={section.content}
            onChange={(e) => updateSection(section.id, { content: e.target.value })}
            placeholder="Enter text content..."
            rows={4}
            className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
          />
        );
        
      case 'image':
        return (
          <div className="space-y-3">
            <input
              type="text"
              value={section.src}
              onChange={(e) => updateSection(section.id, { src: e.target.value })}
              placeholder="Image URL"
              className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
            />
            
            <input
              type="text"
              value={section.alt}
              onChange={(e) => updateSection(section.id, { alt: e.target.value })}
              placeholder="Alt text (for accessibility)"
              className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
            />
            
            <input
              type="text"
              value={section.caption || ''}
              onChange={(e) => updateSection(section.id, { caption: e.target.value })}
              placeholder="Caption (optional)"
              className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
            />
          </div>
        );
        
      case 'columns':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <textarea
              value={section.leftContent}
              onChange={(e) => updateSection(section.id, { leftContent: e.target.value })}
              placeholder="Left column content..."
              rows={4}
              className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
            />
            
            <textarea
              value={section.rightContent}
              onChange={(e) => updateSection(section.id, { rightContent: e.target.value })}
              placeholder="Right column content..."
              rows={4}
              className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
            />
          </div>
        );
        
      case 'callout':
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <select
                value={section.style}
                onChange={(e) => updateSection(section.id, { style: e.target.value })}
                className="bg-dark border border-gray-700 rounded-lg px-2 py-1 text-white text-sm focus:border-primary focus:outline-none"
              >
                <option value="info">Information</option>
                <option value="warning">Warning</option>
                <option value="tip">Tip</option>
                <option value="note">Note</option>
              </select>
            </div>
            
            <textarea
              value={section.content}
              onChange={(e) => updateSection(section.id, { content: e.target.value })}
              placeholder="Callout content..."
              rows={3}
              className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
            />
          </div>
        );
        
      case 'code':
        return (
          <div className="space-y-3">
            <input
              type="text"
              value={section.language || ''}
              onChange={(e) => updateSection(section.id, { language: e.target.value })}
              placeholder="Language (e.g. javascript, html, css)"
              className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
            />
            
            <textarea
              value={section.content}
              onChange={(e) => updateSection(section.id, { content: e.target.value })}
              placeholder="Code content..."
              rows={6}
              className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-2 text-white font-mono focus:border-primary focus:outline-none"
            />
          </div>
        );
        
      default:
        return <p className="text-red-400">Unknown section type</p>;
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link
            href="/admin/pages"
            className="mr-4 text-white/70 hover:text-primary transition-colors"
          >
            <FaArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold text-white font-orbitron">Create New Page</h1>
        </div>
        
        <div className="flex space-x-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublished"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="isPublished" className="text-white text-sm">Publish Page</label>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/80 text-dark font-medium py-2 px-4 rounded-lg flex items-center transition-colors disabled:opacity-50"
          >
            <FaSave className="mr-2" /> {isSubmitting ? 'Saving...' : 'Save Page'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Page Metadata */}
        <div className="bg-secondary rounded-lg border border-primary/20 p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Page Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Page Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="e.g. About Us"
                className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                required
              />
            </div>
            
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                URL Slug <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <span className="text-white/50 mr-1">/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="e.g. about-us"
                  className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                  required
                />
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-white text-sm font-medium mb-2">
                Meta Description
              </label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Brief description for search engines..."
                rows={2}
                className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
              />
              <p className="text-white/50 text-xs mt-1">Recommended: 150-160 characters for optimal SEO.</p>
            </div>
          </div>
        </div>
        
        {/* Page Content Sections */}
        <div className="space-y-6 mb-6">
          {sections.map((section, index) => (
            <div 
              key={section.id} 
              className="bg-secondary rounded-lg border border-primary/20 p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-medium">
                  {SECTION_TYPES.find(t => t.id === section.type)?.label || 'Section'}
                </h3>
                
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => moveSection(section.id, 'up')}
                    disabled={index === 0}
                    className="text-white/70 hover:text-white disabled:opacity-30 disabled:hover:text-white/70"
                    title="Move Up"
                  >
                    ↑
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => moveSection(section.id, 'down')}
                    disabled={index === sections.length - 1}
                    className="text-white/70 hover:text-white disabled:opacity-30 disabled:hover:text-white/70"
                    title="Move Down"
                  >
                    ↓
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => removeSection(section.id)}
                    className="text-red-400 hover:text-red-500"
                    title="Remove Section"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              
              {renderSectionEditor(section)}
            </div>
          ))}
        </div>
        
        {/* Add Section Button */}
        <div className="bg-secondary rounded-lg border border-primary/20 p-6">
          <h3 className="text-white font-medium mb-4">Add New Section</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {SECTION_TYPES.map(type => (
              <button
                key={type.id}
                type="button"
                onClick={() => addSection(type.id)}
                className="flex flex-col items-center justify-center bg-dark/50 hover:bg-dark/80 border border-gray-700 hover:border-primary/50 rounded-lg p-3 transition-colors"
              >
                <div className="text-white/70 mb-2">{type.icon}</div>
                <span className="text-sm text-white/80">{type.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 mt-6">
          <Link
            href="/admin/pages"
            className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg flex items-center transition-colors"
          >
            <FaTimes className="mr-2" /> Cancel
          </Link>
          
          <button
            type="submit"
            className="bg-primary hover:bg-primary/80 text-dark font-medium py-2 px-4 rounded-lg flex items-center transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            <FaSave className="mr-2" /> {isSubmitting ? 'Saving...' : 'Save Page'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewPagePage; 