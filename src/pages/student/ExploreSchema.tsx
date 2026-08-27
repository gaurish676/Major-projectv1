import React, { useState, useEffect } from 'react';
import { SchemaCategory, SchemaRule } from '../../types';
import { apiRequest } from '../../lib/api';
import {
  BookOpen,
  Award,
  Layers,
  Search,
  CheckCircle2,
  Shield,
  Sparkles,
  Info,
} from 'lucide-react';

export const ExploreSchema: React.FC = () => {
  const [categories, setCategories] = useState<SchemaCategory[]>([]);
  const [rules, setRules] = useState<SchemaRule[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [catData, ruleData] = await Promise.all([
          apiRequest<SchemaCategory[]>('/api/schema/categories'),
          apiRequest<SchemaRule[]>('/api/schema/rules'),
        ]);
        setCategories(catData);
        setRules(ruleData);
      } catch (err) {
        console.error('Failed to load schema rules:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredRules = rules.filter((r) => {
    const matchesCategory = selectedCategory === 'all' || r.category_id === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      r.activity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.criteria.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.category_name && r.category_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Official 200 Activity Points Marking Schema</span>
            </h1>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
              v1.0 Active
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Centrally governed by HOD. Approved points are subject to category domain caps.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>HOD Certified Standard</span>
        </div>
      </div>

      {/* Category Domain Caps Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(selectedCategory === c.id ? 'all' : c.id)}
            className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
              selectedCategory === c.id
                ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-2xs font-semibold'
                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
            }`}
          >
            <div className="text-[11px] font-bold truncate">{c.name}</div>
            <div className="text-xs font-bold text-indigo-600 mt-0.5 font-mono">
              Cap {c.max_cap_points}p
            </div>
            <div className="text-[10px] text-slate-400">
              {c.rules_count || 0} Rules
            </div>
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search activity rules, certification names, criteria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 text-xs rounded border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Categories ({rules.length})
          </button>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {filteredRules.map((rule) => (
          <div
            key={rule.id}
            className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-2"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {rule.category_name}
                </span>
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                  +{rule.base_points} pts
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-xs">
                {rule.activity_name}
              </h3>

              <div className="p-2 rounded bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-0.5">
                <div className="font-semibold text-slate-800 flex items-center gap-1 text-[10px]">
                  <Info className="w-3 h-3 text-indigo-600" /> Evidence Criteria:
                </div>
                <p className="text-[11px] leading-snug text-slate-600">{rule.criteria}</p>
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span>Cap: <strong className="font-mono">{rule.max_cap_points} pts</strong></span>
              <span className="font-mono text-[9px] bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                v{rule.version}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
