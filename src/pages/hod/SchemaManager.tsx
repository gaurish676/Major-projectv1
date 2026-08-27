import React, { useState, useEffect } from 'react';
import { SchemaCategory, SchemaRule } from '../../types';
import { apiRequest } from '../../lib/api';
import {
  Sliders,
  PlusCircle,
  Edit3,
  BookOpen,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  History,
} from 'lucide-react';

export const SchemaManager: React.FC = () => {
  const [categories, setCategories] = useState<SchemaCategory[]>([]);
  const [rules, setRules] = useState<SchemaRule[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add / Edit Rule Modal
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<SchemaRule | null>(null);
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formActivityName, setFormActivityName] = useState('');
  const [formBasePoints, setFormBasePoints] = useState<number>(20);
  const [formCriteria, setFormCriteria] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Category Cap Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SchemaCategory | null>(null);
  const [formCapPoints, setFormCapPoints] = useState<number>(60);

  const loadSchema = async () => {
    try {
      setIsLoading(true);
      const [catData, rulesData] = await Promise.all([
        apiRequest<SchemaCategory[]>('/api/schema/categories'),
        apiRequest<SchemaRule[]>('/api/schema/rules'),
      ]);
      setCategories(catData);
      setRules(rulesData);
      if (catData.length > 0 && !formCategoryId) {
        setFormCategoryId(catData[0].id);
      }
    } catch (err) {
      console.error('Failed to load schema:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchema();
  }, []);

  const openAddRule = () => {
    setEditingRule(null);
    setFormActivityName('');
    setFormBasePoints(20);
    setFormCriteria('');
    if (categories.length > 0) setFormCategoryId(categories[0].id);
    setFormError(null);
    setIsRuleModalOpen(true);
  };

  const openEditRule = (rule: SchemaRule) => {
    setEditingRule(rule);
    setFormCategoryId(rule.category_id);
    setFormActivityName(rule.activity_name);
    setFormBasePoints(rule.base_points);
    setFormCriteria(rule.criteria);
    setFormError(null);
    setIsRuleModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formActivityName.trim() || !formCriteria.trim() || !formCategoryId) {
      setFormError('All fields are required');
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      if (editingRule) {
        // Update existing rule (increments version)
        await apiRequest(`/api/schema/rules/${editingRule.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            activity_name: formActivityName.trim(),
            base_points: Number(formBasePoints),
            criteria: formCriteria.trim(),
          }),
        });
        setToastMessage(`Schema rule updated successfully. Schema version incremented to reflect change.`);
      } else {
        // Add new rule
        await apiRequest('/api/schema/rules', {
          method: 'POST',
          body: JSON.stringify({
            category_id: formCategoryId,
            activity_name: formActivityName.trim(),
            base_points: Number(formBasePoints),
            criteria: formCriteria.trim(),
          }),
        });
        setToastMessage(`New activity rule created and published to active CSE schema.`);
      }

      setIsRuleModalOpen(false);
      await loadSchema();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save schema rule');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditCategory = (cat: SchemaCategory) => {
    setEditingCategory(cat);
    setFormCapPoints(cat.max_cap_points);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategoryCap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setIsSaving(true);
    try {
      await apiRequest(`/api/schema/categories/${editingCategory.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          max_cap_points: Number(formCapPoints),
        }),
      });
      setToastMessage(`Domain cap for ${editingCategory.name} updated to ${formCapPoints} pts.`);
      setIsCategoryModalOpen(false);
      await loadSchema();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredRules =
    activeCategoryId === 'all'
      ? rules
      : rules.filter((r) => r.category_id === activeCategoryId);

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Centralized Activity Marking Schema Engine</span>
            </h1>
            <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <History className="w-3 h-3" /> Versioned Engine
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            As Head of Department, define the 200 Activity Points weightages, criteria, and category domain caps.
          </p>
        </div>

        <button
          onClick={openAddRule}
          className="px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
          <span>Add Rule</span>
        </button>
      </div>

      {/* Toast alert banner */}
      {toastMessage && (
        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Categories & Max Cap Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Category Domain Caps (Total System Cap: 200p)</span>
          </h2>
          <span className="text-[10px] text-slate-400">Click to adjust domain caps</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className={`p-2.5 rounded-lg border transition-all flex flex-col justify-between space-y-1.5 bg-white ${
                activeCategoryId === c.id
                  ? 'border-indigo-600 ring-1 ring-indigo-500/20 shadow-2xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="text-xs font-bold text-slate-900 truncate">{c.name}</div>
                <div className="text-xs font-mono font-bold text-indigo-600 mt-0.5">
                  Cap: {c.max_cap_points}p
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setActiveCategoryId(activeCategoryId === c.id ? 'all' : c.id)}
                  className="text-[9px] font-semibold text-slate-500 hover:text-indigo-600 cursor-pointer"
                >
                  {activeCategoryId === c.id ? 'Show All' : 'Filter'}
                </button>
                <button
                  onClick={() => openEditCategory(c)}
                  className="text-[9px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Edit Cap
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rules Table / Catalog */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
              Official Schema Catalog ({filteredRules.length} Rules)
            </h3>
            {activeCategoryId !== 'all' && (
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-1.5 py-0.2 rounded">
                Filtered: {categories.find((c) => c.id === activeCategoryId)?.name}
              </span>
            )}
          </div>

          {activeCategoryId !== 'all' && (
            <button
              onClick={() => setActiveCategoryId('all')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-2 px-3">Activity Name</th>
                <th className="py-2 px-3">Domain Category</th>
                <th className="py-2 px-3">Evidence Criteria Requirements</th>
                <th className="py-2 px-3 text-center">Version</th>
                <th className="py-2 px-3 text-right">Points</th>
                <th className="py-2 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-2.5 px-3 font-bold text-slate-900 text-xs">
                    {rule.activity_name}
                  </td>

                  <td className="py-2.5 px-3 font-medium text-slate-700 text-xs">
                    {rule.category_name}
                  </td>

                  <td className="py-2.5 px-3 text-slate-600 max-w-md">
                    <p className="line-clamp-2 text-[10px]">{rule.criteria}</p>
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                      v{rule.version}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                      +{rule.base_points}p
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => openEditRule(rule)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 text-slate-600" />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Schema Rule Modal */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white text-sm sm:text-base">
                  {editingRule ? `Update Schema Rule (Increments Version)` : 'Add New Official Schema Rule'}
                </h3>
              </div>
              <button
                onClick={() => setIsRuleModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="p-4 space-y-3">
              {formError && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {!editingRule && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Category Domain <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Cap: {c.max_cap_points} pts)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Activity Name / Certification Standard <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formActivityName}
                  onChange={(e) => setFormActivityName(e.target.value)}
                  placeholder="e.g. AWS Certified Solutions Architect"
                  required
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Official Point Weightage (pts) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  step="5"
                  value={formBasePoints}
                  onChange={(e) => setFormBasePoints(Number(e.target.value))}
                  required
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Evidence Verification Criteria for Mentors <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={formCriteria}
                  onChange={(e) => setFormCriteria(e.target.value)}
                  rows={2}
                  placeholder="Specify certificate issuer, minimum score, verification URL, or required signatures..."
                  required
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              {editingRule && (
                <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-[10px] text-amber-900 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Schema Versioning Rule:</strong> Editing this rule increments version to <strong>v{editingRule.version + 1}</strong>. Historical submissions under v{editingRule.version} remain immutably preserved.
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded transition cursor-pointer"
                >
                  {isSaving ? 'Saving...' : editingRule ? 'Update & Increment' : 'Publish Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Cap Modal */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-sm bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <h3 className="font-bold text-white text-xs sm:text-sm">
                Adjust Domain Cap: {editingCategory.name}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategoryCap} className="p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Maximum Allowable Cap Points
                </label>
                <input
                  type="number"
                  min="20"
                  max="100"
                  step="5"
                  value={formCapPoints}
                  onChange={(e) => setFormCapPoints(Number(e.target.value))}
                  required
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-hidden font-mono font-bold text-slate-900"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Students cannot count points beyond this threshold towards the 200 requirement.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-3.5 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded cursor-pointer"
                >
                  Save Cap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
