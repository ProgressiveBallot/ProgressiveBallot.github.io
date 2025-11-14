import React, { useState, useEffect } from 'react';
import { Search, ThumbsUp, ThumbsDown, MapPin, User, ExternalLink, Phone, Mail, MapPinned, Calendar } from 'lucide-react';
import Papa from 'papaparse';

const generateBioGuideUrl = (legInfo) => {

    if (!legInfo || !legInfo.bioguide_id) return null;

    return `https://bioguide.congress.gov/search/bio/${legInfo.bioguide_id}`;

  };



  const formatAddress = (address) => {

    if (!address) return '';

    // Add commas before building names and DC/state

    return address

      .replace(/(\d+)\s+([A-Z])/g, '$1, $2') // Add comma after street number

      .replace(/Building\s+([A-Z])/g, 'Building, $1') // Add comma after Building

      .replace(/DC\s+(\d)/g, 'DC, $1'); // Add comma after DC

  };



  const generateOpenSecretsUrl = (legInfo) => {

    if (!legInfo || !legInfo.opensecrets_id) return null;

    

    const firstName = (legInfo.nickname || legInfo.first_name || '').toLowerCase().trim();

    const lastName = (legInfo.last_name || '').toLowerCase().trim();

    

    if (!firstName || !lastName) return null;

    

    const nameSlug = `${firstName}-${lastName}`;

    return `https://www.opensecrets.org/personal-finances/${nameSlug}/net-worth?cid=${legInfo.opensecrets_id}`;

  };

const App = () => {
  const [searchType, setSearchType] = useState('zip');
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState(null);
  const [selectedPolitician, setSelectedPolitician] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [previousView, setPreviousView] = useState(null);
  const [error, setError] = useState('');
  const [records, setRecords] = useState([]);
  const [recordSearchValue, setRecordSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [legislatorData, setLegislatorData] = useState([]);
  const [submitPoliticians, setSubmitPoliticians] = useState('');
  const [submitRecord, setSubmitRecord] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');

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
    const initialRecords = [
      {
        id: '1',
        type: 'negative',
        details: 'Voted to increase ACA healthcare premiums for millions of Americans.',
        politicians: ['John Fetterman'],
        timestamp: Date.now() - 86400000
      },
      {
        id: '2',
        type: 'positive',
        details: 'Consistently fought for Medicare for All and expanded healthcare access.',
        politicians: ['Bernard Sanders'],
        timestamp: Date.now() - 172800000
      },
      {
        id: '3',
        type: 'positive',
        details: 'Authored legislation to raise minimum wage to $15 per hour.',
        politicians: ['Bernard Sanders'],
        timestamp: Date.now() - 259200000
      },
      {
        id: '4',
        type: 'positive',
        details: 'Strong advocate for clean energy and environmental protection legislation.',
        politicians: ['Maria Cantwell', 'Sheldon Whitehouse'],
        timestamp: Date.now() - 345600000
      },
      {
        id: '5',
        type: 'negative',
        details: 'Supported legislation weakening antitrust enforcement against big tech companies.',
        politicians: ['Amy Klobuchar'],
        timestamp: Date.now() - 432000000
      },
      {
        id: '6',
        type: 'positive',
        details: 'Led bipartisan efforts to lower prescription drug costs.',
        politicians: ['Amy Klobuchar', 'Bernard Sanders'],
        timestamp: Date.now()
      },
      {
        id: '7',
        type: 'positive',
        details: 'Leading advocate for climate change action and corporate accountability.',
        politicians: ['Sheldon Whitehouse'],
        timestamp: Date.now() - 518400000
      },
      {
        id: '8',
        type: 'negative',
        details: 'Supported a funding deal without ACA subsidy protections, causing significant healthcare premium increases for millions of Americans.',
        politicians: ['John Fetterman', 'Catherine Cortez Masto', 'Richard J. Durbin', 'Maggie Hassan', 'Time Kaine', 'Angus King', 'Jacky Rosen', 'Jeanne Shaheen'],
        timestamp: Date.now() - 518400000
      },
      {
        id: '9',
        type: 'negative',
        details: 'Voted against all measures in recent years to block arms sales to the Israeli government while they were actively commiting genocide against Palestinians.',
        politicians: ['Ron Wyden'],
        timestamp: Date.now()
      },
      {
        id: '10',
        type: 'negative',
        details: 'Endorsed by and funded by AIPAC, an organization that opposes efforts to hold the Israeli government accountable for acts of genocide committed against Palestinians.',
        politicians: ['Ron Wyden'],
        timestamp: Date.now()
      }
    ];
    
    setRecords(initialRecords);
    
    try {
      localStorage.setItem('records-data', JSON.stringify(initialRecords));
    } catch (err) {
      console.error('Error loading records:', err);
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

  const formatPoliticianInfo = (name, legInfo = null) => {
    const info = legInfo || getLegislatorInfo(name);
    let role = '';
    let displayName = name;
    
    if (info) {
      const type = info.type?.trim();
      if (type === 'sen') {
        role = 'Senator';
      } else if (type === 'rep' && info.district) {
        role = `Representative, District ${info.district}`;
      } else if (type === 'rep') {
        role = 'Representative';
      }

      // Use nickname if available
      if (info.nickname) {
        displayName = `${info.nickname} ${info.last_name}`;
      }
    }

    return {
      name: displayName,
      originalName: name,
      state: info?.state?.trim() || '',
      role,
      party: info?.party?.trim() || '',
      legInfo: info
    };
  };

  const getPoliticianRecommendation = (name, party) => {
    // Republicans are automatically not recommended
    if (party?.toLowerCase() === 'republican') {
      return false;
    }

    // Check if politician has more positive or negative records
    const politicianRecords = records.filter(c => 
      c.politicians.some(p => p.toLowerCase() === name.toLowerCase())
    );

    const positiveCount = politicianRecords.filter(c => c.type === 'positive').length;
    const negativeCount = politicianRecords.filter(c => c.type === 'negative').length;

    if (positiveCount > negativeCount && positiveCount >= 2) return true;
    if (negativeCount > positiveCount && negativeCount >= 2) return false;

    return undefined;
  };

  const getPoliticianDescription = (name) => {
    const nameLower = name.toLowerCase();
    const descriptions = {
      'bernard sanders': 'A democratic socialist and longtime progressive advocate who has consistently fought for working-class Americans, healthcare reform, and economic justice.',
      'amy klobuchar': 'A moderate Democrat who often sides with corporate interests over progressive policies. Known for compromising on key progressive issues.',
      'sheldon whitehouse': 'A strong progressive voice on climate change and corruption. Has been a tireless advocate for holding corporations accountable.'
    };

    return descriptions[nameLower] || null;
  };

  const handleSearch = async () => {
    setError('');
    setResults(null);
    setSelectedPolitician(null);
    setSelectedRecord(null);

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
        reps.push(formatPoliticianInfo(name, sen));
      });

      if (representative) {
        const name = representative.full_name?.trim() || `${representative.first_name} ${representative.last_name}`;
        reps.push(formatPoliticianInfo(name, representative));
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
        const politicianRecords = records.filter(c => 
          c.politicians.some(p => p.toLowerCase() === name.toLowerCase())
        );

        return {
          ...formatPoliticianInfo(name, leg),
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
    const politicianRecords = records.filter(c =>
      c.politicians.some(p => p.toLowerCase() === (politician.originalName || politician.name).toLowerCase())
    );
    
    const legInfo = politician.legInfo || getLegislatorInfo(politician.originalName || politician.name);

    setPreviousView(selectedRecord ? 'record' : (results ? 'results' : 'home'));
    
    setSelectedPolitician({
      ...politician,
      records: politicianRecords,
      legInfo: legInfo,
      age: legInfo ? calculateAge(legInfo.birthday) : null,
      recommended: getPoliticianRecommendation(politician.originalName || politician.name, legInfo?.party),
      description: getPoliticianDescription(politician.originalName || politician.name)
    });

    setSelectedRecord(null);
  };



  const viewRecordDetails = (record, fromPolitician = false) => {
    const recordPoliticians = record.politicians.map(name => {
      const legInfo = getLegislatorInfo(name);
      return formatPoliticianInfo(name, legInfo);
    });

    if (fromPolitician) {
      setPreviousView('politician');
    } else {
      setPreviousView(null);
    }

    setSelectedRecord({
      ...record,
      politicianDetails: recordPoliticians
    });
    setSelectedPolitician(null);
    setResults(null);
  };

  const goBack = () => {
    if (previousView === 'politician' && selectedRecord) {
      // Going back from record to politician - need to restore politician view
      const politicianToRestore = selectedRecord.politicianDetails?.find(p => 
        records.some(c => c.politicians.includes(p.originalName || p.name))
      );
      if (politicianToRestore) {
        viewPoliticianDetails(politicianToRestore);
        setPreviousView(null);
      } else {
        setSelectedRecord(null);
        setPreviousView(null);
      }
    } else if (previousView === 'record' && selectedPolitician) {
      // Going back from politician to record - need to restore record view
      const recordToRestore = records.find(c => 
        c.politicians.some(p => p.toLowerCase() === (selectedPolitician.originalName || selectedPolitician.name).toLowerCase())
      );
      if (recordToRestore) {
        viewRecordDetails(recordToRestore, false);
        setPreviousView(null);
      } else {
        setSelectedPolitician(null);
        setPreviousView(null);
      }
    } else if (previousView === 'results' && selectedPolitician) {
      // Going back from politician to search results
      setSelectedPolitician(null);
      setPreviousView(null);
    } else {
      // Default: go back to home
      resetToHome();
    }
  };

  const handleSubmitRecord = async (e) => {
    e.preventDefault();
    setSubmitStatus('sending');
    
    try {
      // Read credentials
      const credsData = await window.fs.readFile('credentials.txt', { encoding: 'utf8' });
      const [email, password] = credsData.split('\n').map(line => line.trim());
      
      // In a real application, this would call a backend API endpoint
      // that handles the actual email sending with nodemailer
      // For demo purposes, we'll simulate it
      
      const emailBody = `
New Record Submission for The Progressive Ballot

Politicians:
${submitPoliticians}

Record Information:
${submitRecord}
`;
      
      // Simulated API call
      console.log('Would send email to: garrett@garretthaines.info');
      console.log('Subject: New record submission for The Political Ballot');
      console.log('Body:', emailBody);
      
      // Simulate success
      setSubmitStatus('success');
      setSubmitPoliticians('');
      setSubmitRecord('');
      
      setTimeout(() => setSubmitStatus(''), 3000);
    } catch (err) {
      console.error('Error submitting record:', err);
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus(''), 3000);
    }
  };

  const resetToHome = () => {
    setSearchValue('');
    setResults(null);
    setSelectedPolitician(null);
    setSelectedRecord(null);
    setPreviousView(null);
    setError('');
    setRecordSearchValue('');
    setSubmitPoliticians('');
    setSubmitRecord('');
    setSubmitStatus('');
  };

  const recentRecords = [...records].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  
  const filteredRecords = recordSearchValue.trim() 
    ? records.filter(record => 
        record.details.toLowerCase().includes(recordSearchValue.toLowerCase()) ||
        record.politicians.some(p => p.toLowerCase().includes(recordSearchValue.toLowerCase()))
      )
    : recentRecords;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-xl text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl md:max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center pt-4 mb-7 md:mb-10">
          <a 
            onClick={resetToHome}
            className="font-neuton text-indigo-800 mb-3 cursor-pointer hover:opacity-80 transition-opacity tracking-tight"
          >
            <span
            className="text-4xl md:text-5xl"
            >
              The<br></br>
            </span>
            <h1 
            className="-mt-3 md:-mt-5 text-5xl md:text-7xl inline-block pb-4 border-b-2 border-gray-400"
            >
              Progressive Ballot
            </h1>
          </a>
          <p className="text-gray-600 mt-3 text-sm md:text-xl">See who fights for progress — and who impedes it.</p>
        </div>

        {/* Search Section */}
        {!selectedRecord && !selectedPolitician && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-gray-100 p-6 md:p-8 mb-8">
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Politicians</h3>
              
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

            <div className="flex gap-3 w-full">
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
                placeholder={searchType === 'zip' ? 'Enter 5-digit ZIP code...' : 'Enter politician name...'}
                className="flex-1 min-w-0 px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="bg-indigo-600 text-white px-6 md:px-8 py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-md flex-shrink-0"
              >
                <Search className="inline md:mr-2 -mt-1" size={20} />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Search Results */}
        {results && !selectedPolitician && !selectedRecord && (
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
              onClick={goBack}
              className="mb-6 text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-2 transition-colors"
            >
              ← Back
            </button>
            
            <div className="mb-8">
              <div className="flex items-start gap-3 mb-3">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{selectedPolitician.name}</h2>
                {selectedPolitician.recommended == "yes" && (
                  <span className="text-3xl leading-none" title="Progressive">✅</span>
                )}
                {selectedPolitician.recommended == "no" && (
                  <span className="text-3xl leading-none" title="Obstructionist">❌</span>
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
                      <span className="text-gray-700 text-sm">{formatAddress(selectedPolitician.legInfo.address)}</span>
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
                  {generateBioGuideUrl(selectedPolitician.legInfo) && (
                    <div className="flex items-center gap-3">
                      <ExternalLink className="text-indigo-600" size={20} />
                      <a 
                        href={generateBioGuideUrl(selectedPolitician.legInfo)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 underline font-medium"
                      >
                        Congressional Biography
                      </a>
                    </div>
                  )}
                  {generateOpenSecretsUrl(selectedPolitician.legInfo) && (
                    <div className="flex items-center gap-3">
                      <ExternalLink className="text-indigo-600" size={20} />
                      <a 
                        href={generateOpenSecretsUrl(selectedPolitician.legInfo)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 underline font-medium"
                      >
                        OpenSecrets Profile
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
                    onClick={() => viewRecordDetails(record, true)}
                    className={`p-5 rounded-xl border-l-4 cursor-pointer hover:shadow-md transition-all ${
                      record.type === 'positive'
                        ? 'bg-goodGreen-50 border-goodGreen-500 hover:bg-goodGreen-100'
                        : 'bg-badOrange-50 border-badOrange-500 hover:bg-badOrange-100'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {record.type === 'positive' ? (
                        <ThumbsUp className="text-goodGreen-600 mt-1 flex-shrink-0" size={24} />
                      ) : (
                        <ThumbsDown className="text-badOrange-600 mt-1 flex-shrink-0" size={24} />
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

        {/* Record Details */}
        {selectedRecord && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-gray-100 p-6 md:p-8 mb-8">
            <button
              onClick={goBack}
              className="mb-6 text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-2 transition-colors"
            >
              ← Back
            </button>
            
            <div className={`p-5 rounded-xl border-l-4 mb-8 ${
              selectedRecord.type === 'positive'
                ? 'bg-goodGreen-50 border-goodGreen-500'
                : 'bg-badOrange-50 border-badOrange-500'
            }`}>
              <div className="flex items-start gap-4">
                {selectedRecord.type === 'positive' ? (
                  <ThumbsUp className="text-goodGreen-600 mt-1 flex-shrink-0" size={32} />
                ) : (
                  <ThumbsDown className="text-badOrange-600 mt-1 flex-shrink-0" size={32} />
                )}
                <p className="text-gray-900 flex-1 leading-relaxed text-lg font-medium">{selectedRecord.details}</p>
              </div>
            </div>

           {/* <h3 className="text-2xl font-bold text-gray-900 mb-6">Politicians Associated with This Record</h3> */}
            <div className="space-y-3">
              {selectedRecord.politicianDetails.map((pol, idx) => (
                <div
                  key={idx}
                  onClick={() => viewPoliticianDetails(pol)}
                  className="p-5 border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all bg-white"
                >
                  <h4 className="font-bold text-lg text-gray-900">{pol.name}</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    {pol.role && `${pol.role} - `}
                    {pol.state}
                    {pol.party && ` (${pol.party})`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Records */}
        {!results && !selectedPolitician && !selectedRecord && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-gray-100 p-6 md:p-8">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Legislation</h3>
            
            <div className="mb-6">
              <input
                type="text"
                value={recordSearchValue}
                onChange={(e) => setRecordSearchValue(e.target.value)}
                placeholder="Search by keyword or politician name..."
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
            
            <div className="space-y-4">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record, idx) => (
                  <div
                    key={idx}
                    onClick={() => viewRecordDetails(record)}
                    className={`p-5 rounded-xl border-l-4 cursor-pointer hover:shadow-md transition-all ${
                      record.type === 'positive'
                        ? 'bg-goodGreen-50 border-goodGreen-500 hover:bg-goodGreen-100'
                        : 'bg-badOrange-50 border-badOrange-500 hover:bg-badOrange-100'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {record.type === 'positive' ? (
                        <ThumbsUp className="text-goodGreen-600 mt-1 flex-shrink-0" size={24} />
                      ) : (
                        <ThumbsDown className="text-badOrange-600 mt-1 flex-shrink-0" size={24} />
                      )}
                      <div className="flex-1">
                        <p className="text-gray-800 leading-relaxed mb-2">{record.details}</p>
                        <p className="text-sm text-gray-600">
                          {record.politicians.length} {record.politicians.length === 1 ? 'politician' : 'politicians'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 text-center py-8">No records found matching your search.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;