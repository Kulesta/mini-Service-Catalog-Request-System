export function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="skeleton h-44 w-full" />
            <div className="p-5 space-y-3">
                <div className="skeleton h-5 w-3/4 rounded-lg" />
                <div className="skeleton h-4 w-1/2 rounded-lg" />
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <div className="skeleton h-10 flex-1 rounded-xl" />
                    <div className="skeleton h-10 flex-1 rounded-xl" />
                </div>
            </div>
        </div>
    );
}

export function SkeletonStat() {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-1 bg-gray-100" />
            <div className="p-6 space-y-3">
                <div className="skeleton h-10 w-10 rounded-xl" />
                <div className="skeleton h-4 w-24 rounded-lg" />
                <div className="skeleton h-8 w-16 rounded-lg" />
            </div>
        </div>
    );
}

export function SkeletonRequest() {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-1 bg-gray-100" />
            <div className="p-6">
                <div className="flex items-start gap-4">
                    <div className="skeleton w-12 h-12 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="skeleton h-5 w-40 rounded-lg" />
                        <div className="skeleton h-4 w-32 rounded-lg" />
                        <div className="skeleton h-3 w-48 rounded-lg" />
                    </div>
                    <div className="text-right space-y-2">
                        <div className="skeleton h-7 w-20 rounded-lg ml-auto" />
                        <div className="skeleton h-6 w-24 rounded-full ml-auto" />
                    </div>
                </div>
                <div className="mt-4 flex gap-2">
                    <div className="skeleton h-6 w-28 rounded-lg" />
                    <div className="skeleton h-6 w-32 rounded-lg" />
                </div>
            </div>
        </div>
    );
}
