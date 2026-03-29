import { useState, useEffect, useMemo } from 'react';
import { DesignCard } from '../components/DesignCard';
import { TagFilter } from '../components/TagFilter';
import { SearchBar } from '../components/SearchBar';
import { getDesigns, getTags } from '../lib/api';
import type { Design } from '../types';

export function Gallery() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDesigns(), getTags()])
      .then(([designsResult, tags]) => {
        setDesigns(designsResult.designs);
        setAllTags(tags);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    getDesigns({ tags: selectedTags.length > 0 ? selectedTags : undefined, search: searchQuery || undefined })
      .then(result => setDesigns(result.designs))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedTags, searchQuery]);

  const filteredDesigns = useMemo(() => {
    if (!searchQuery) return designs;
    
    const query = searchQuery.toLowerCase();
    return designs.filter(design =>
      design.name.toLowerCase().includes(query) ||
      design.description?.toLowerCase().includes(query) ||
      design.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [designs, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">3D Design Shop</h1>
              <p className="mt-1 text-gray-500">Explore our collection of 3D printable models</p>
            </div>
            <a
              href="/admin"
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Admin
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 space-y-4">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <TagFilter
            availableTags={allTags}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredDesigns.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {searchQuery || selectedTags.length > 0
                ? 'No designs match your filters'
                : 'No designs available yet'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-gray-500 mb-4">{filteredDesigns.length} design{filteredDesigns.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDesigns.map(design => (
                <DesignCard key={design.id} design={design} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
