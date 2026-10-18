import React, { useState, useEffect } from 'react';
import { DepartmentEvent } from '../../types';
import { apiRequest } from '../../lib/api';
import { Calendar, MapPin, ExternalLink, Users2, Sparkles } from 'lucide-react';
import { CollegeClubs } from './CollegeClubs';

interface StudentEventsProps {
  onNavigateTab?: (tab: string) => void;
  initialTab?: 'events' | 'clubs';
}

export const StudentEvents: React.FC<StudentEventsProps> = ({
  onNavigateTab,
  initialTab = 'events',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'events' | 'clubs'>(initialTab);
  const [events, setEvents] = useState<DepartmentEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true);
        const data = await apiRequest<DepartmentEvent[]>('/api/events');
        setEvents(data);
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadEvents();
  }, []);

  return (
    <div className="space-y-4">
      {/* Top Header with Tab Switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <span>Campus Activities & Clubs</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Discover department events, hackathons, and student clubs to earn degree activity points.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('events')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'events'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Upcoming Events ({events.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('clubs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'clubs'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users2 className="w-3.5 h-3.5" />
            <span>Student Clubs</span>
          </button>
        </div>
      </div>

      {/* Sub-view 1: Upcoming Department Events */}
      {activeSubTab === 'events' ? (
        <div className="space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading campus events...</div>
          ) : events.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
              No upcoming events scheduled at this moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {evt.category_name || 'Department Activity'}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        +{evt.potential_points} pts
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 leading-snug">
                      {evt.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {evt.description}
                    </p>

                    <div className="pt-1 space-y-1 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-800">Date: {evt.event_date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>Venue: {evt.venue}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      AICTE Activity Point Eligible
                    </span>

                    {evt.registration_link && (
                      <a
                        href={evt.registration_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer"
                      >
                        <span>Register</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Sub-view 2: Student Clubs */
        <CollegeClubs onNavigateTab={onNavigateTab} />
      )}
    </div>
  );
};
