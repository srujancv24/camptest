import CampgroundCard from './CampgroundCard.jsx';

const SearchResults = ({ results, totalCount, loading, onLoadMore, hasMore }) => {
    if (loading && results.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Searching Campgrounds...</h3>
                <p className="text-gray-600">Please wait while we find the best campgrounds for you.</p>
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                    <div className="text-6xl">🏕️</div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Campgrounds Found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search criteria or selecting a different state.</p>

                <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                    <h4 className="font-medium text-blue-900 mb-2">Tips for better results:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Try searching without date restrictions</li>
                        <li>• Select a different state or activity</li>
                        <li>• Make sure your dates are in the future</li>
                    </ul>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Results Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Search Results</h2>
                    <p className="text-gray-600">
                        Found {totalCount} campground{totalCount !== 1 ? 's' : ''} matching your criteria
                    </p>
                </div>

                <div className="text-sm text-gray-500">
                    Showing {results.length} of {totalCount}
                </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((campground, index) => (
                    <CampgroundCard
                        key={campground.id || campground.recreation_gov_id || index}
                        campground={campground}
                        searchParams={results.searchParams}
                    />
                ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
                <div className="text-center">
                    <button
                        onClick={onLoadMore}
                        disabled={loading}
                        className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
                    >
                        {loading ? (
                            <span className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Loading More...
                            </span>
                        ) : (
                            'Load More Campgrounds'
                        )}
                    </button>
                </div>
            )}

            {/* Loading indicator for load more */}
            {loading && results.length > 0 && (
                <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            )}
        </div>
    );
};

export default SearchResults;