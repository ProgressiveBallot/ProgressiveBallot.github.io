import React, { useState, useEffect } from 'react';
import { Search, ThumbsUp, ThumbsDown, MapPin, User, ExternalLink, Phone, Mail, MapPinned, Calendar } from 'lucide-react';
import Papa from 'papaparse';

const App = () => {
  const [searchType, setSearchType] = useState('zip');
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState(null);
  const [selectedPolitician, setSelectedPolitician] = useState(null);
  const [error, setError] = useState('');
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [legislatorData, setLegislatorData] = useState([]);

  const loadData = async () => {
    await loadRecords();
    await loadLegislators();
    setIsLoading(false);
  };
  
  useEffect(() => {
    loadData();
  }, []);

  const loadLegislators = async () => {
    try {
      const data = await fetch('/legislators_current.csv').then(r => r.text());
      const parsed = Papa.parse(data, { header: true, skipEmptyLines: true });
      setLegislatorData(parsed.data);
    } catch (err) {
      console.error('Error loading legislators:', err);
    }
  };

  const loadRecords = async () => {
    try {
      // Force refresh by clearing old data and setting new data
      const initialRecords = [
        {
          id: '1',
          name: 'John Fetterman',
          state: 'PA',
          type: 'negative',
          details: 'Voted to increase ACA healthcare premiums for millions of Americans.'
        },
        {
          id: '2',
          name: 'Bernard Sanders',
          state: 'VT',
          type: 'positive',
          details: 'Consistently fought for Medicare for All and expanded healthcare access.'
        },
        {
          id: '3',
          name: 'Bernard Sanders',
          state: 'VT',
          type: 'positive',
          details: 'Authored legislation to raise minimum wage to $15 per hour.'
        },
        {
          id: '4',
          name: 'Maria Cantwell',
          state: 'WA',
          type: 'positive',
          details: 'Strong advocate for clean energy and environmental protection legislation.'
        },
        {
          id: '5',
          name: 'Amy Klobuchar',
          state: 'MN',
          type: 'negative',
          details: 'Supported legislation weakening antitrust enforcement against big tech companies.'
        },
        {
          id: '6',
          name: 'Amy Klobuchar',
          state: 'MN',
          type: 'positive',
          details: 'Led bipartisan efforts to lower prescription drug costs.'
        },
        {
          id: '7',
          name: 'Sheldon Whitehouse',
          state: 'RI',
          type: 'positive',
          details: 'Leading advocate for climate change action and corporate accountability.'
        }
      ];
      
      setRecords(initialRecords);
      
      try {
        await window.storage.set('politician-records', JSON.stringify(initialRecords));
      } catch (setError) {
        console.error('Error saving records:', setError);
      }
    } catch (err) {
      console.error('Error loading records:', err);
      setRecords([]);
    }
  };

  const getLegislatorInfo = (name) => {
    return legislatorData.find(leg => {
      const fullName = (leg.full_name || `${leg.first_name} ${leg.last_name}`).trim();
      const firstName = leg.first_name?.trim() || '';
      const lastName = leg.last_name?.trim() || '';
      const nickname = leg.nickname?.trim() || '';
      
      const nameLower = name.toLowerCase();
      
      return fullName.toLowerCase() === nameLower ||
             `${firstName} ${lastName}`.toLowerCase() === nameLower ||
             (nickname && `${nickname} ${lastName}`.toLowerCase() === nameLower);
    });
  };

  const calculateAge = (birthday) => {
    if (!birthday) return null;
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatPoliticianInfo = (name, state, legInfo = null) => {
    const info = legInfo || getLegislatorInfo(name);
    let role = '';
    
    if (info) {
      const type = info.type?.trim();
      if (type === 'sen') {
        role = 'Senator';
      } else if (type === 'rep' && info.district) {
        role = `Representative, District ${info.district}`;
      } else if (type === 'rep') {
        role = 'Representative';
      }
    }

    return {
      name,
      state,
      role,
      party: info?.party?.trim() || '',
      legInfo: info
    };
  };

  const handleSearch = async () => {
    setError('');
    setResults(null);
    setSelectedPolitician(null);

    if (!searchValue.trim()) {
      setError('Please enter a search value');
      return;
    }

    if (searchType === 'zip') {
      if (!/^\d{5}$/.test(searchValue)) {
        setError('Please enter a valid 5-digit ZIP code');
        return;
      }
      await searchByZip(searchValue);
    } else {
      await searchByName(searchValue);
    }
  };

  const searchByZip = async (zip) => {
    try {
      const zipData = await fetch('/zip_districts.csv').then(r => r.text());
      const zipParsed = Papa.parse(zipData, { header: true, skipEmptyLines: true });

      const zipRow = zipParsed.data.find(row => row.zip?.trim() === zip);

      if (!zipRow) {
        setError('ZIP code not found in database');
        return;
      }

      const state = zipRow.state_abbr?.trim();
      const district = zipRow.cd?.trim();

      const senators = legislatorData.filter(leg => 
        leg.state?.trim() === state && leg.type?.trim() === 'sen'
      );

      const representative = legislatorData.find(leg =>
        leg.state?.trim() === state && 
        leg.district?.trim() === district && 
        leg.type?.trim() === 'rep'
      );

      const reps = [];
      senators.forEach(sen => {
        const name = sen.full_name?.trim() || `${sen.first_name} ${sen.last_name}`;
        reps.push(formatPoliticianInfo(name, state, sen));
      });

      if (representative) {
        const name = representative.full_name?.trim() || `${representative.first_name} ${representative.last_name}`;
        reps.push(formatPoliticianInfo(name, state, representative));
      }

      setResults({
        zip,
        state,
        district,
        representatives: reps
      });

    } catch (err) {
      setError('Error reading files: ' + err.message);
    }
  };

  const searchByName = async (name) => {
    try {
      const searchLower = name.toLowerCase();
      
      const csvMatches = legislatorData.filter(leg => {
        const fullName = (leg.full_name || `${leg.first_name} ${leg.last_name}`).toLowerCase();
        const firstName = (leg.first_name || '').toLowerCase();
        const lastName = (leg.last_name || '').toLowerCase();
        const nickname = (leg.nickname || '').toLowerCase();
        
        return fullName.includes(searchLower) || 
               firstName.includes(searchLower) || 
               lastName.includes(searchLower) ||
               nickname.includes(searchLower);
      });

      if (csvMatches.length === 0) {
        setError('No politicians found with that name');
        return;
      }

      const allMatches = csvMatches.map(leg => {
        const name = leg.full_name?.trim() || `${leg.first_name} ${leg.last_name}`.trim();
        
        // Find records that match this legislator by name or bioguide_id
        const politicianRecords = records.filter(r => {
          const recordName = r.name.toLowerCase();
          const csvName = name.toLowerCase();
          if (recordName === csvName) return true;
          
          // Check using legislator lookup
          const recordLeg = getLegislatorInfo(r.name);
          return recordLeg && recordLeg.bioguide_id === leg.bioguide_id;
        });
        
        return {
          ...formatPoliticianInfo(name, leg.state?.trim(), leg),
          recordCount: politicianRecords.length
        };
      });

      setResults({
        nameSearch: true,
        matches: allMatches
      });

    } catch (err) {
      setError('Error searching: ' + err.message);
    }
  };

  const viewPoliticianDetails = (politician) => {
    // Normalize the name to find all matching records
    const politicianRecords = records.filter(r => {
      const recordName = r.name.toLowerCase();
      const searchName = politician.name.toLowerCase();
      
      // Direct match
      if (recordName === searchName) return true;
      
      // Check if they're the same person using legislator info
      const recordLeg = getLegislatorInfo(r.name);
      const searchLeg = politician.legInfo || getLegislatorInfo(politician.name);
      
      if (recordLeg && searchLeg) {
        return recordLeg.bioguide_id === searchLeg.bioguide_id;
      }
      
      return false;
    });
    
    const legInfo = politician.legInfo || getLegislatorInfo(politician.name);
    
    setSelectedPolitician({
      ...politician,
      records: politicianRecords,
      legInfo: legInfo,
      age: legInfo ? calculateAge(legInfo.birthday) : null
    });
  };

  const resetToHome = () => {
    setSearchValue('');
    setResults(null);
    setSelectedPolitician(null);
    setError('');
  };

  const featuredPoliticians = records.reduce((acc, record) => {
    const existing = acc.find(p => {
      // Match by name
      if (p.name.toLowerCase() === record.name.toLowerCase()) return true;
      
      // Match by bioguide_id if available
      if (p.legInfo && p.legInfo.bioguide_id) {
        const recordLeg = getLegislatorInfo(record.name);
        return recordLeg && recordLeg.bioguide_id === p.legInfo.bioguide_id;
      }
      
      return false;
    });
    
    if (existing) {
      existing.entries.push(record);
    } else {
      const legInfo = getLegislatorInfo(record.name);
      const politicianInfo = formatPoliticianInfo(record.name, record.state, legInfo);
      acc.push({
        ...politicianInfo,
        legInfo: legInfo,
        entries: [record]
      });
    }
    return acc;
  }, []);

  const featuredPositive = featuredPoliticians.filter(p => 
    p.entries.some(e => e.type === 'positive')
  ).slice(0, 3);
  
  const featuredNegative = featuredPoliticians.filter(p => 
    p.entries.some(e => e.type === 'negative')
  ).slice(0, 3);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 
            onClick={resetToHome}
            className="text-4xl md:text-6xl font-black text-indigo-900 mb-3 cursor-pointer hover:opacity-80 transition-opacity tracking-tight"
          >
            THE PROGRESSIVE BALLOT
          </h1>
          <p className="text-gray-600 text-base md:text-lg">Track congressional votes and hold representatives accountable</p>
        </div>

        {/* Search Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-gray-100 p-6 md:p-8 mb-8">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={() => setSearchType('zip')}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                searchType === 'zip'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MapPin className="inline mr-2" size={20} />
              Search by ZIP Code
            </button>
            <button
              onClick={() => setSearchType('name')}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                searchType === 'name'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <User className="inline mr-2" size={20} />
              Search by Name
            </button>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => {
                const val = e.target.value;
                if (searchType === 'zip') {
                  if (/^\d{0,5}$/.test(val)) {
                    setSearchValue(val);
                  }
                } else {
                  setSearchValue(val);
                }
              }}
              placeholder={searchType === 'zip' ? 'Enter ZIP code (e.g., 02830)' : 'Enter politician name'}
              className="flex-1 px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="bg-indigo-600 text-white px-6 md:px-8 py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-md"
            >
              <Search className="inline mr-2" size={20} />
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
              {error}
            </div>
          )}
        </div>

        {/* Search Results */}
        {results && !selectedPolitician && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-gray-100 p-6 md:p-8 mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              {results.nameSearch ? 'Search Results' : `Your Representatives - ${results.state} District ${results.district}`}
            </h2>

            <div className="space-y-3">
              {(results.nameSearch ? results.matches : results.representatives).map((rep, idx) => (
                <div
                  key={idx}
                  onClick={() => viewPoliticianDetails(rep)}
                  className="p-5 border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">{rep.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {rep.role && `${rep.role} - `}
                        {rep.state}
                        {rep.party && ` (${rep.party})`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {rep.recordCount !== undefined && rep.recordCount > 0 && (
                        <span className="px-4 py-2 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-700">
                          {rep.recordCount} {rep.recordCount === 1 ? 'Entry' : 'Entries'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Politician Details */}
        {selectedPolitician && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-gray-100 p-6 md:p-8 mb-8">
            <button
              onClick={() => setSelectedPolitician(null)}
              className="mb-6 text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-2 transition-colors"
            >
              ← Back to Results
            </button>
            
            <div className="mb-8">
              <div className="flex items-start gap-3 mb-3">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{selectedPolitician.name}</h2>
                {selectedPolitician.recommended === true && (
                  <span className="text-3xl leading-none" title="Recommended">🟢</span>
                )}
                {selectedPolitician.recommended === false && (
                  <span className="text-3xl leading-none" title="Not Recommended">🔴</span>
                )}
              </div>
              <p className="text-xl text-gray-600 mb-4">
                {selectedPolitician.role && `${selectedPolitician.role} - `}
                {selectedPolitician.state}
                {selectedPolitician.party && ` (${selectedPolitician.party})`}
              </p>

              {selectedPolitician.description && (
                <div className="p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-lg mb-6">
                  <p className="text-gray-800 leading-relaxed">{selectedPolitician.description}</p>
                </div>
              )}

              {selectedPolitician.legInfo && (
                <div className="grid sm:grid-cols-2 gap-4 p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-100">
                  {selectedPolitician.age && (
                    <div className="flex items-center gap-3">
                      <Calendar className="text-indigo-600" size={20} />
                      <span className="text-gray-700 font-medium">Age: {selectedPolitician.age}</span>
                    </div>
                  )}
                  {selectedPolitician.legInfo.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="text-indigo-600" size={20} />
                      <span className="text-gray-700">{selectedPolitician.legInfo.phone}</span>
                    </div>
                  )}
                  {selectedPolitician.legInfo.address && (
                    <div className="flex items-center gap-3 sm:col-span-2">
                      <MapPinned className="text-indigo-600" size={20} />
                      <span className="text-gray-700 text-sm">{selectedPolitician.legInfo.address}</span>
                    </div>
                  )}
                  {selectedPolitician.legInfo.url && (
                    <div className="flex items-center gap-3">
                      <ExternalLink className="text-indigo-600" size={20} />
                      <a 
                        href={selectedPolitician.legInfo.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 underline font-medium"
                      >
                        Official Website
                      </a>
                    </div>
                  )}
                  {selectedPolitician.legInfo.contact_form && (
                    <div className="flex items-center gap-3">
                      <Mail className="text-indigo-600" size={20} />
                      <a 
                        href={selectedPolitician.legInfo.contact_form} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 underline font-medium"
                      >
                        Contact Form
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">Records</h3>
            {selectedPolitician.records && selectedPolitician.records.length > 0 ? (
              <div className="space-y-4">
                {selectedPolitician.records.map((record, idx) => (
                  <div
                    key={idx}
                    className={`p-5 rounded-xl border-l-4 ${
                      record.type === 'positive'
                        ? 'bg-green-50 border-green-500'
                        : 'bg-red-50 border-red-500'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {record.type === 'positive' ? (
                        <ThumbsUp className="text-green-600 mt-1 flex-shrink-0" size={24} />
                      ) : (
                        <ThumbsDown className="text-red-600 mt-1 flex-shrink-0" size={24} />
                      )}
                      <p className="text-gray-800 flex-1 leading-relaxed">{record.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No records found for this politician.</p>
            )}
          </div>
        )}

        {/* Featured Politicians */}
        {!results && !selectedPolitician && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Positive Featured */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-gray-100 p-6 md:p-8">
              <h3 className="text-2xl md:text-3xl font-bold text-green-700 mb-6 flex items-center gap-3">
                <ThumbsUp size={32} />
                Progressive Champions
              </h3>
              <div className="space-y-4">
                {featuredPositive.map((pol, idx) => (
                  <div
                    key={idx}
                    onClick={() => viewPoliticianDetails(pol)}
                    className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:border-green-300 hover:shadow-md cursor-pointer transition-all"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <h4 className="font-bold text-lg text-gray-900 flex-1">{pol.name}</h4>
                      {pol.recommended === true && (
                        <span className="text-2xl leading-none" title="Recommended">🟢</span>
                      )}
                      {pol.recommended === false && (
                        <span className="text-2xl leading-none" title="Not Recommended">🔴</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {pol.role && `${pol.role} - `}{pol.state}
                      {pol.party && ` (${pol.party})`}
                    </p>
                    <p className="text-gray-700 text-sm font-medium">
                      {pol.entries.filter(e => e.type === 'positive').length} positive {pol.entries.filter(e => e.type === 'positive').length === 1 ? 'entry' : 'entries'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Negative Featured */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-gray-100 p-6 md:p-8">
              <h3 className="text-2xl md:text-3xl font-bold text-red-700 mb-6 flex items-center gap-3">
                <ThumbsDown size={32} />
                Accountability Watch
              </h3>
              <div className="space-y-4">
                {featuredNegative.map((pol, idx) => (
                  <div
                    key={idx}
                    onClick={() => viewPoliticianDetails(pol)}
                    className="p-5 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-200 hover:border-red-300 hover:shadow-md cursor-pointer transition-all"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <h4 className="font-bold text-lg text-gray-900 flex-1">{pol.name}</h4>
                      {pol.recommended === true && (
                        <span className="text-2xl leading-none" title="Recommended">🟢</span>
                      )}
                      {pol.recommended === false && (
                        <span className="text-2xl leading-none" title="Not Recommended">🔴</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {pol.role && `${pol.role} - `}{pol.state}
                      {pol.party && ` (${pol.party})`}
                    </p>
                    <p className="text-gray-700 text-sm font-medium">
                      {pol.entries.filter(e => e.type === 'negative').length} negative {pol.entries.filter(e => e.type === 'negative').length === 1 ? 'entry' : 'entries'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;