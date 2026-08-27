import React, { useState, useEffect } from 'react';
import { DepartmentEvent } from '../../types';
import { apiRequest } from '../../lib/api';
import { Calendar, Award, MapPin, ExternalLink, Sparkles, Clock, CheckCircle } from 'lucide-react';

export const StudentEvents: React.FC = () => {
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
    <div className="space-y-3.5">
      {/* Header */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Department Activities & Hackathons</span>
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Approved engineering department events to earn points towards the 200-point requirement.
          </p>
        </div>

        <div className="text-xs font-semibold px-2.5 py-1 rounded bg-indigo-50 border border-indigo-100 text-indigo-900">
          {events.length} Live Opportunities
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {events.map((evt) => (
          <div
            key={evt.id}
            className="bg-white rounded-lg p-3.5 border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-2.5"
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

              <p className="text-[11px] text-slate-600 leading-relaxed">
                {evt.description}
              </p>

              <div className="pt-1 space-y-1 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span className="font-medium text-slate-800">Date: {evt.event_date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>Venue: {evt.venue}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Auto-eligible for schema verification
              </span>

              {evt.registration_link && (
                <a
                  href={evt.registration_link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer"
                >
                  <span>Register</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
