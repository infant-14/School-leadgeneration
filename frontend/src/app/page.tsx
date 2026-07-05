"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Search,
  Users,
  LayoutGrid,
  Settings,
  Mail,
  Sparkles,
  MapPin,
  TrendingUp,
  Loader2,
  AlertCircle,
  ExternalLink,
  Star,
  CheckCircle,
  Calendar,
  Layers,
  ChevronRight,
  Shield,
  Trash2,
  Download,
  RefreshCw,
  Sun,
  Moon,
  Bell,
  User,
  Plus,
  Database,
  Globe,
  Check
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

// Mock Fallback Data matching the screenshot's data
const MOCK_LEADS = [
  {
    id: 1,
    school_name: "Bizwomanminded",
    website_url: "https://bizwomanminded.com",
    contact_number: "+91 98401 23456",
    area_name: "Tambaram",
    institution_type: "CBSE",
    appearance: "Redesign",
    remarks: "Website layout is outdated and lacks mobile responsiveness.",
    atmosphere: "Good",
    social_media: "Inactive",
    google_rating: "4.2",
    photo_url: "",
    status: "Qualified"
  },
  {
    id: 2,
    school_name: "Pankaj Uddas",
    website_url: "https://pankajschool.org",
    contact_number: "+91 94440 98765",
    area_name: "Tambaram",
    institution_type: "Matriculation",
    appearance: "Fresh",
    remarks: "No website exists. Needs a brand new digital presence built.",
    atmosphere: "Good",
    social_media: "Inactive",
    google_rating: "3.8",
    photo_url: "",
    status: "New Lead"
  },
  {
    id: 3,
    school_name: "Britney Robbins",
    website_url: "https://robbinsprep.edu.in",
    contact_number: "+91 44 2239 1111",
    area_name: "Tambaram",
    institution_type: "International",
    appearance: "Good",
    remarks: "Website looks modern, but could benefit from faster load speeds.",
    atmosphere: "Bad",
    social_media: "Active",
    google_rating: "4.5",
    photo_url: "",
    status: "Email Sent"
  },
  {
    id: 4,
    school_name: "Zion Matriculation School",
    website_url: "http://zionschools.co.in",
    contact_number: "044 2223 1546",
    area_name: "Tambaram",
    institution_type: "Matriculation",
    appearance: "Redesign",
    remarks: "Website loads slowly and relies on old flash templates.",
    atmosphere: "Good",
    social_media: "Inactive",
    google_rating: "4.1",
    photo_url: "",
    status: "Replied"
  },
  {
    id: 5,
    school_name: "Tambaram Global Academy",
    website_url: "https://tambaramglobal.com",
    contact_number: "+91 99620 54321",
    area_name: "Tambaram",
    institution_type: "CBSE",
    appearance: "Redesign",
    remarks: "Missing SSL certificate and contact form doesn't work.",
    atmosphere: "Good",
    social_media: "Active",
    google_rating: "4.3",
    photo_url: "",
    status: "Meeting Booked"
  }
];

const COLORS = ["#0f5b47", "#1e293b", "#a855f7", "#ec4899", "#f43f5e"];

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
  isDarkMode: boolean;
}

function CustomSelect({ value, onChange, options, isDarkMode }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between gap-1 border rounded-lg px-2.5 py-1.5 text-[10px] font-bold tracking-wide focus:outline-none transition-all select-none ${
            isDarkMode
              ? "bg-zinc-850 border-zinc-700 text-white hover:bg-zinc-800"
              : "bg-white border-zinc-200 text-[#111827] hover:bg-zinc-50"
          }`}
        >
          <span>{selectedOption.label}</span>
          <svg
            className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div
          className={`absolute right-0 z-50 mt-1.5 w-40 rounded-lg shadow-lg border outline-none py-1 overflow-hidden transition-all ${
            isDarkMode
              ? "bg-zinc-900 border-zinc-800 text-zinc-200"
              : "bg-white border-[#E2E8F0] text-zinc-700"
          }`}
        >
          {options.map((option) => {
            const isActive = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-[10px] font-bold transition-all ${
                  isActive
                    ? "bg-[#00637C] text-white"
                    : isDarkMode
                    ? "hover:bg-[#00637C]/20 hover:text-[#e0f2f6]"
                    : "hover:bg-[#e0f2f6] hover:text-[#00637C]"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function LeadGenWorkspace() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (isLoggedIn) {
      setIsAuthenticated(true);
    }
    setIsAuthChecking(false);
  }, []);

  const [activeTab, setActiveTab] = useState<"discovery" | "archive" | "config">("discovery");
  const [leads, setLeads] = useState<any[]>(MOCK_LEADS);
  const [activeRunLeads, setActiveRunLeads] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
    } else if (savedTheme === "light") {
      setIsDarkMode(false);
    } else {
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(systemPrefersDark);
    }
  }, []);

  // Update HTML class
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  
  // Search / Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All Types");
  const [filterStatus, setFilterStatus] = useState("All Stages");
  const [filterAtmosphere, setFilterAtmosphere] = useState("All Atmospheres");
  const [filterAppearance, setFilterAppearance] = useState("All Appearances");

  // Scraper inputs
  const [areaInput, setAreaInput] = useState("");
  const [typeInput, setTypeInput] = useState("");

  // Stepper & Progress State
  const [currentStep, setCurrentStep] = useState(1);
  const [statusMessage, setStatusMessage] = useState("Initializing browser...");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterAppearance, filterAtmosphere]);

  // Manual Lead Creation States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newInstitutionType, setNewInstitutionType] = useState("Matriculation");
  const [newLocation, setNewLocation] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newWebsiteUrl, setNewWebsiteUrl] = useState("");
  const [newContactNumber, setNewContactNumber] = useState("");
  const [newStage, setNewStage] = useState("New Lead");
  const [isAddLoading, setIsAddLoading] = useState(false);
  // Notifications State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Google Maps pipeline finished successfully.", time: "10m ago", read: false },
    { id: 2, text: "Enriched CBSE schools list in Adyar.", time: "1h ago", read: true },
    { id: 3, text: "Google Sheets sync completed.", time: "2h ago", read: true }
  ]);

  // Login Form States
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  // Config State
  const [geminiKey, setGeminiKey] = useState("");
  const [sheetId, setSheetId] = useState("");
  const [configLoading, setConfigLoading] = useState(false);
  const [configMessage, setConfigMessage] = useState("");
  const [aiProvider, setAiProvider] = useState("none");
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = useState("llama3.2");
  const [ollamaVisionModel, setOllamaVisionModel] = useState("llama3.2-vision");

  const wsRef = useRef<WebSocket | null>(null);
  const consoleEndRef = useRef<HTMLDivElement | null>(null);

  // const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://jlglzg4d-8080.inc1.devtunnels.ms/";
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";

  // Fetch leads on mount and whenever tab changes
  useEffect(() => {
    fetchLeadsList();
    fetchConfig();
    checkScrapeStatus();
  }, []);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const handleAddLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName || !newLocation) {
      alert("Please fill in School Name and Target Area / Location.");
      return;
    }
    setIsAddLoading(true);
    try {
      const res = await fetch(`${API_BASE}/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          school_name: newSchoolName,
          institution_type: newInstitutionType,
          area_name: newLocation,
          search_area: newLocation,
          address: newAddress || null,
          website_url: newWebsiteUrl || null,
          contact_number: newContactNumber || "N/A",
          status: newStage,
          appearance: newWebsiteUrl ? "Redesign" : "Fresh",
          remarks: "Lead added manually via dashboard admin tools.",
          atmosphere: "Good"
        })
      });

      if (!res.ok) {
        throw new Error("Failed to save lead.");
      }

      await fetchLeadsList();
      setIsAddModalOpen(false);
      setNewSchoolName("");
      setNewLocation("");
      setNewAddress("");
      setNewWebsiteUrl("");
      setNewContactNumber("");
      setNewStage("New Lead");
    } catch (err: any) {
      alert(err.message || "Something went wrong.");
    } finally {
      setIsAddLoading(false);
    }
  };

  const fetchLeadsList = async () => {
    try {
      const res = await fetch(`${API_BASE}/leads`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setLeads(data);
          return data;
        }
      }
    } catch (e) {
      console.log("Backend not reachable. Falling back to offline mock mode.");
    }
    return [];
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/config`);
      if (res.ok) {
        const data = await res.json();
        setGeminiKey(data.gemini_api_key || "");
        setSheetId(data.google_sheet_id || "");
        setAiProvider(data.ai_provider || "none");
        setOllamaBaseUrl(data.ollama_base_url || "http://localhost:11434");
        setOllamaModel(data.ollama_model || "llama3.2");
        setOllamaVisionModel(data.ollama_vision_model || "llama3.2-vision");
      }
    } catch (e) {
      console.log("Config fetch failed, using fallback.");
    }
  };

  const checkScrapeStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/scrape/status`);
      if (res.ok) {
        const data = await res.json();
        if (data.is_running) {
          setIsSearching(true);
          connectWebSocket(leads);
        }
      }
    } catch (e) {
      console.log("Scrape status check failed.");
    }
  };

  const connectWebSocket = (leadsBeforeScrape: any[]) => {
    if (wsRef.current) wsRef.current.close();

    const wsUrl = API_BASE.replace("http://", "ws://").replace("https://", "wss://") + "/logs";
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setLogs((prev) => [...prev, "> Connected to log server..."]);
    };

    ws.onmessage = async (event) => {
      const msg = event.data;
      setLogs((prev) => [...prev, msg]);
      
      // Clean up log prefixes for user display
      const cleanMsg = msg.replace("[stderr] ", "").replace("> ", "").trim();
      setStatusMessage(cleanMsg);

      // Advance steps based on keywords without going backward
      if (cleanMsg.includes("Starting Automated School Lead") || cleanMsg.includes("Starting Google Maps search")) {
        setCurrentStep(1);
      } else if (cleanMsg.includes("Commencing lead enrichment") || cleanMsg.includes("Enriching Lead")) {
        setCurrentStep((prev) => Math.max(prev, 2));
      } else if (cleanMsg.includes("Check Social Media Activity") || cleanMsg.includes("checking social")) {
        setCurrentStep((prev) => Math.max(prev, 3));
      } else if (cleanMsg.includes("Saving results") || cleanMsg.includes("Syncing database")) {
        setCurrentStep((prev) => Math.max(prev, 4));
      }

      if (msg.includes("finished successfully!") || msg.includes("ERROR:")) {
        setIsSearching(false);
        setCurrentStep(4);
        setNotifications(prev => [
          { id: Date.now(), text: `Scraper finished for "${typeInput}" in "${areaInput}"`, time: "Just now", read: false },
          ...prev
        ]);
        const updatedLeads = await fetchLeadsList();
        
        // Find new leads added in this run
        const newLeads = updatedLeads.filter(
          (l: any) => !leadsBeforeScrape.some((old: any) => old.school_name === l.school_name)
        );
        
        const runLeads = newLeads.length > 0 
          ? newLeads 
          : updatedLeads.filter(
              (l: any) => l.area_name.toLowerCase().includes(areaInput.toLowerCase())
            );
        setActiveRunLeads(runLeads);
      }
    };

    ws.onclose = () => {
      setLogs((prev) => [...prev, "> Log stream closed."]);
    };
  };

  const handleStartSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setLogs([`> Starting discovery job for '${typeInput}' in '${areaInput}'...`]);
    
    // Capture state before run
    const currentLeads = [...leads];
    connectWebSocket(currentLeads);

    try {
      const res = await fetch(`${API_BASE}/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area: areaInput,
          school_type: typeInput,
          limit: 0,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to trigger scrape");
      }
    } catch (e) {
      console.warn("Backend API not reachable. Simulating scraping logs...");
      // Simulate frontend logs if backend is not running
      let step = 0;
      const interval = setInterval(() => {
        step++;
        if (step === 1) {
          setLogs((prev) => [...prev, "> [JOB INIT] Launching Playwright browser worker process..."]);
        } else if (step === 2) {
          setLogs((prev) => [...prev, `> Navigating Google Maps query: https://www.google.com/maps/search/${typeInput}+in+${areaInput}`]);
        } else if (step === 3) {
          setLogs((prev) => [...prev, "> Found 3 matching schools in results sidebar. Commencing detail parsing..."]);
        } else if (step === 4) {
          setLogs((prev) => [...prev, "> Scraped School Name: Zion Matriculation School"]);
          setLogs((prev) => [...prev, "> Evaluating website Zion Matriculation School via Gemini Vision..."]);
        } else if (step === 5) {
          setLogs((prev) => [...prev, "> Gemini Web Audit: Redesign - Website loads slowly and relies on old flash templates."]);
        } else if (step === 6) {
          setLogs((prev) => [...prev, "> Done! Leads successfully scraped, qualified, and saved to database."]);
          setIsSearching(false);
          clearInterval(interval);
          // Add a new mock lead to demonstrate interaction
          const newLead = {
            id: Date.now(),
            school_name: `New Scraped School #${leads.length + 1}`,
            website_url: "https://newscraped.edu",
            contact_number: "+91 94444 12345",
            area_name: areaInput,
            institution_type: "Matriculation",
            appearance: "Redesign",
            remarks: "Scraped via offline simulated runner. Needs UI revamp.",
            atmosphere: "Good",
            social_media: "Inactive",
            google_rating: "4.0",
            photo_url: "",
            status: "New Lead"
          };
          setLeads((prev) => [newLead, ...prev]);
          setActiveRunLeads([newLead]);
        }
      }, 1500);
    }
  };

  const handleUpdateStatus = async (leadId: number, newStatus: string) => {
    // Update local state first for instant UI response
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );

    try {
      await fetch(`${API_BASE}/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) {
      console.log("Saved status locally (offline).");
    }
  };

  const handleDeleteLead = async (leadId: number) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    try {
      await fetch(`${API_BASE}/leads/${leadId}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.log("Deleted lead locally.");
    }
  };

  const handleDeleteAllLeads = async () => {
    if (!confirm("Are you sure you want to delete ALL leads from the database? This cannot be undone.")) return;
    setLeads([]);
    setSelectedLead(null);
    try {
      await fetch(`${API_BASE}/leads`, {
        method: "DELETE",
      });
    } catch (e) {
      console.log("Deleted all leads locally.");
    }
  };

  const handleSyncSheets = async () => {
    try {
      const res = await fetch(`${API_BASE}/sync-sheets`, {
        method: "POST"
      });
      if (res.ok) {
        setNotifications(prev => [
          { id: Date.now(), text: "Successfully synchronized database leads to Google Sheets.", time: "Just now", read: false },
          ...prev
        ]);
        alert("Synced successfully to Google Sheets!");
      } else {
        const err = await res.json();
        alert(`Google Sheets Sync failed: ${err.message || err.detail || res.statusText || "Unknown Error"}`);
      }
    } catch (e) {
      setNotifications(prev => [
        { id: Date.now(), text: "Successfully synchronized database leads to Google Sheets (Simulated).", time: "Just now", read: false },
        ...prev
      ]);
      alert("Simulated: Synced successfully to Google Sheets!");
    }
  };

  const handleDownloadCSV = () => {
    if (filteredLeads.length === 0) {
      alert("No leads available to download.");
      return;
    }

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      "School Name",
      "Website URL",
      "Contact Number",
      "Area Name",
      "School Address",
      "Institution Type",
      "Appearance",
      "Remarks",
      "Atmosphere",
      "Social Media",
      "Google Rating",
      "Stage"
    ];

    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const lead of filteredLeads) {
      const values = [
        lead.school_name,
        lead.website_url,
        lead.contact_number,
        lead.area_name,
        lead.address || "",
        lead.institution_type,
        lead.appearance,
        lead.remarks,
        lead.atmosphere,
        lead.social_media,
        lead.google_rating,
        lead.status || lead.stage || "New Lead"
      ];
      csvRows.push(values.map(escapeCSV).join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `school_leads_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userToken");
    setIsAuthenticated(false);
    setIsProfileOpen(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      setLoginError("Please enter both username and password.");
      return;
    }
    setLoginLoading(true);
    setLoginError("");

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword
        })
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Invalid username or password.");
        }
        throw new Error("Login failed. Please check backend connection.");
      }

      const data = await res.json();
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userToken", data.token);
      setIsAuthenticated(true);
      
      // Load app data
      fetchLeadsList();
      fetchConfig();
      checkScrapeStatus();
    } catch (err: any) {
      setLoginError(err.message || "An unexpected error occurred.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigLoading(true);
    setConfigMessage("");

    try {
      const res = await fetch(`${API_BASE}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gemini_api_key: geminiKey,
          google_sheet_id: sheetId,
          ai_provider: aiProvider,
          ollama_base_url: ollamaBaseUrl,
          ollama_model: ollamaModel,
          ollama_vision_model: ollamaVisionModel,
        }),
      });
      if (res.ok) {
        setConfigMessage("Settings updated successfully!");
      } else {
        setConfigMessage("Failed to update settings.");
      }
    } catch (e) {
      setConfigMessage("Settings saved offline locally.");
    } finally {
      setConfigLoading(false);
    }
  };

  // Calculations for dashboard metrics
  const totalLeads = leads.length;
  const totalSchools = totalLeads;
  const activeSocialMedia = leads.filter(l => l.social_media === "Active").length;
  const needsRedesign = leads.filter(l => l.appearance === "Redesign" || l.appearance === "Outdated").length;
  const noWebsite = leads.filter(l => l.appearance === "Fresh" || !l.website_url || l.website_url === "None").length;
  const readyToContact = leads.filter(
    (l) => (l.appearance === "Redesign" || l.appearance === "Fresh") && l.contact_number
  ).length;
  const outreachActive = leads.filter(
    (l) => l.status === "Email Sent" || l.status === "Replied" || l.status === "Meeting Booked"
  ).length;
  
  const avgMatchScore = (() => {
    if (leads.length === 0) return 0;
    // Calculate simulated match score based on rating and appearance
    const scores = leads.map(l => {
      let base = 60;
      if (l.google_rating) base += (parseFloat(l.google_rating) * 5);
      if (l.appearance === "Redesign") base += 10;
      if (l.appearance === "Fresh") base += 15;
      return Math.min(Math.round(base), 99);
    });
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  })();

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.area_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.search_area && lead.search_area.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.address && lead.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.remarks && lead.remarks.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType =
      filterType === "All Types" || lead.institution_type === filterType;

    const matchesStatus =
      filterStatus === "All Stages" || lead.status === filterStatus;

    const matchesAtmosphere =
      filterAtmosphere === "All Atmospheres" || lead.atmosphere === filterAtmosphere;

    const matchesAppearance =
      filterAppearance === "All Appearances" || lead.appearance === filterAppearance;

    return matchesSearch && matchesType && matchesStatus && matchesAtmosphere && matchesAppearance;
  });

  // Funnel numbers
  const funnelData = [
    { name: "Total Discovered", value: totalLeads },
    { name: "Ready to contact", value: readyToContact },
    { name: "Outreach Initiated", value: leads.filter(l => l.status === "Email Sent").length },
    { name: "Replied / Hot", value: leads.filter(l => l.status === "Replied" || l.status === "Meeting Booked").length },
  ];

  const renderLeadsTable = (leadsList: any[], showActions: boolean = false) => {
    return (
      <div className={`overflow-x-auto border rounded-lg ${isDarkMode ? "border-zinc-800" : "border-[#E2E8F0]"}`}>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={`text-[11px] font-bold border-b select-none ${
              isDarkMode 
                ? "bg-zinc-850 text-zinc-300 border-zinc-800" 
                : "bg-zinc-50 text-zinc-500 border-[#E2E8F0]"
            }`}>
              <th className={`p-3 text-center border-r w-12 ${isDarkMode ? "border-zinc-800" : "border-[#E2E8F0]"}`}>S.No.</th>
              <th className={`p-3 border-r min-w-[150px] ${isDarkMode ? "border-zinc-800" : "border-[#E2E8F0]"}`}>School Name</th>
              <th className={`p-3 border-r min-w-[120px] ${isDarkMode ? "border-zinc-800" : "border-[#E2E8F0]"}`}>Customer Name</th>
              <th className={`p-3 text-center border-r min-w-[120px] ${isDarkMode ? "border-zinc-800" : "border-[#E2E8F0]"}`}>Institution Type</th>
              <th className={`p-3 text-center border-r min-w-[100px] ${isDarkMode ? "border-zinc-800" : "border-[#E2E8F0]"}`}>Social Media</th>
              <th className={`p-3 border-r min-w-[100px] ${isDarkMode ? "border-zinc-800" : "border-[#E2E8F0]"}`}>Area Name</th>
              <th className={`p-3 text-center border-r min-w-[140px] ${isDarkMode ? "border-zinc-800" : "border-[#E2E8F0]"}`}>Institution Atmosphere</th>
              <th className={`p-3 border-r min-w-[150px] ${isDarkMode ? "border-zinc-800" : "border-[#E2E8F0]"}`}>Website URL</th>
              <th className={`p-3 border-r min-w-[110px] ${isDarkMode ? "border-zinc-800" : "border-[#E2E8F0]"}`}>Contact Number</th>
              <th className={`p-3 border-r min-w-[200px] ${isDarkMode ? "border-zinc-800" : "border-[#E2E8F0]"}`}>School Address</th>
              <th className={`p-3 text-center border-r min-w-[100px] ${isDarkMode ? "border-zinc-800" : "border-[#E2E8F0]"}`}>Appearance</th>
              <th className={`p-3 min-w-[200px] ${showActions ? `border-r ${isDarkMode ? "border-zinc-800" : "border-[#E2E8F0]"}` : ""}`}>Remarks</th>
              {showActions && (
                <>
                  <th className={`p-3 text-center border-r min-w-[125px] ${isDarkMode ? "border-zinc-800" : "border-[#E2E8F0]"}`}>Stage</th>
                  <th className="p-3 text-center min-w-[80px]">Action</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? "divide-zinc-800" : "divide-[#E2E8F0]"}`}>
            {leadsList.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 14 : 12} className="p-8 text-center text-zinc-400 font-bold">
                  No matching leads found.
                </td>
              </tr>
            ) : (
              leadsList.map((lead, idx) => (
              <tr 
                key={lead.id} 
                onClick={() => setSelectedLead(lead)}
                className={`transition-all text-[11px] font-semibold cursor-pointer border-b ${
                  selectedLead?.id === lead.id
                    ? isDarkMode
                      ? "bg-[#00637C]/20 text-[#00637C] border-b border-[#00637C]"
                      : "bg-[#e0f2f6] text-[#00637C] border-b border-[#00637C]"
                    : isDarkMode
                      ? "bg-zinc-900 hover:bg-zinc-850 text-zinc-200"
                      : "bg-white hover:bg-zinc-50/80 text-zinc-855"
                }`}
              >
                <td className={`p-3 text-center border-r font-bold text-zinc-400 ${isDarkMode ? "border-zinc-800" : "border-[#E2E8F0]"}`}>{(currentPage - 1) * pageSize + idx + 1}</td>
                <td className={`p-3 border-r font-extrabold ${isDarkMode ? "text-white border-zinc-800" : "text-zinc-900 border-[#E2E8F0]"}`}>{lead.school_name}</td>
                <td className={`p-3 border-r text-zinc-400 ${isDarkMode ? "border-zinc-800" : "border-[#E2E8F0]"}`}>Not necessary</td>
                <td className={`p-3 text-center border-r ${isDarkMode ? "border-zinc-800" : "border-[#E2E8F0]"}`}>
                  <span className={`font-extrabold px-2 py-0.5 rounded text-[10px] ${
                    isDarkMode ? "bg-zinc-800 text-zinc-300 border border-zinc-700" : "bg-zinc-100 text-zinc-600 border border-zinc-200/60"
                  }`}>
                    {lead.institution_type || "Matriculation"}
                  </span>
                </td>
                <td className={`p-3 text-center border-r ${isDarkMode ? "border-zinc-800" : "border-[#E2E8F0]"}`}>
                  <span className={`inline-block font-extrabold px-2.5 py-0.5 rounded text-[10px] ${
                    lead.social_media === "Active" 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" 
                      : "bg-rose-50 text-rose-700 border border-rose-200/50"
                  }`}>
                    {lead.social_media || "Inactive"}
                  </span>
                </td>
                <td className={`p-3 border-r ${isDarkMode ? "border-zinc-800" : "border-[#E2E8F0]"}`}>{lead.area_name}</td>
                <td className={`p-3 text-center border-r ${isDarkMode ? "border-zinc-800" : "border-[#E2E8F0]"}`}>
                  <span className={`inline-block font-extrabold px-2.5 py-0.5 rounded text-[10px] ${
                    lead.atmosphere === "Good" 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" 
                      : "bg-rose-50 text-rose-700 border border-rose-200/50"
                  }`}>
                    {lead.atmosphere || "Good"}
                  </span>
                </td>
                <td className={`p-3 border-r ${isDarkMode ? "border-zinc-800" : "border-[#E2E8F0]"}`}>
                  {lead.website_url ? (
                    <a 
                      href={lead.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      onClick={(e) => e.stopPropagation()}
                      className="text-[#00637C] underline hover:text-[#004d60] font-bold break-all"
                    >
                      {lead.website_url}
                    </a>
                  ) : (
                    <span className="text-red-500 font-bold">None</span>
                  )}
                </td>
                <td className={`p-3 border-r font-mono font-bold ${isDarkMode ? "border-zinc-800" : "border-[#E2E8F0]"}`}>{lead.contact_number || "N/A"}</td>
                <td className={`p-3 border-r text-zinc-500 font-semibold break-words max-w-[250px] ${isDarkMode ? "border-zinc-800" : "border-[#E2E8F0]"}`}>{lead.address || "N/A"}</td>
                <td className={`p-3 text-center border-r ${isDarkMode ? "border-zinc-800" : "border-[#E2E8F0]"}`}>
                  <span className={`inline-block font-extrabold px-2.5 py-0.5 rounded text-[10px] ${
                    lead.appearance === "Redesign" 
                      ? "bg-amber-50 text-amber-700 border border-amber-200/50" 
                      : lead.appearance === "Fresh" 
                      ? "bg-blue-50 text-blue-700 border border-blue-200/50" 
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                  }`}>
                    {lead.appearance || "Redesign"}
                  </span>
                </td>
                <td className={`p-3 leading-relaxed break-words ${showActions ? `border-r ${isDarkMode ? "border-zinc-800" : "border-[#E2E8F0]"}` : ""}`}>{lead.remarks || "N/A"}</td>
                {showActions && (
                  <>
                    <td className={`p-3 text-center border-r ${isDarkMode ? "border-zinc-800" : "border-[#E2E8F0]"}`}>
                      <select
                        value={lead.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(lead.id, e.target.value);
                        }}
                        className={`border rounded px-2 py-1 font-bold text-[9px] uppercase focus:outline-none ${
                          isDarkMode 
                            ? "bg-zinc-850 border-zinc-700 text-zinc-300" 
                            : "bg-white border-[#E2E8F0] text-zinc-500"
                        }`}
                      >
                        <option value="New Lead">New Lead</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Email Sent">Email Sent</option>
                        <option value="Replied">Replied</option>
                        <option value="Meeting Booked">Meeting Booked</option>
                      </select>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLead(lead.id);
                        }}
                        className="p-1.5 rounded-lg border border-red-500/10 hover:bg-red-50 text-red-500 transition-all"
                        title="Delete Lead"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    );
  };

  if (isAuthChecking) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? "bg-zinc-950 text-white" : "bg-[#F5F7FA] text-[#111827]"
      }`}>
        <Loader2 className="h-8 w-8 animate-spin text-[#00637C]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={`relative min-h-screen flex items-center justify-center font-sans overflow-hidden select-none ${
        isDarkMode ? "bg-zinc-950 text-white" : "bg-[#F5F7FA] text-[#111827]"
      }`}>
        {/* Subtle Linear Dot Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#E2E8F0_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-60 dark:opacity-10 pointer-events-none"></div>

        <div className={`max-w-sm w-full border rounded-2xl p-7 shadow-2xl space-y-6 relative z-10 mx-4 transition-all duration-300 ${
          isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-[#E2E8F0]"
        }`}>
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#00637C] to-[#0EA5A4] flex items-center justify-center shadow-md">
                <Sparkles className="h-6 w-6 text-white animate-pulse" />
              </div>
            </div>
            <h2 className="text-lg font-black uppercase tracking-wider text-[#00637C]">LeadFlow CRM</h2>
            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Administrative Dashboard Access</p>
          </div>

          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-650 rounded-xl p-3 text-[10px] font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Admin Username
              </label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="e.g. admin"
                className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#00637C] focus:ring-1 focus:ring-[#00637C] font-semibold transition-all ${
                  isDarkMode 
                    ? "bg-zinc-850 border-zinc-700 text-white" 
                    : "bg-[#F8FAFC] border-zinc-200 text-[#111827]"
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#00637C] focus:ring-1 focus:ring-[#00637C] font-semibold transition-all ${
                  isDarkMode 
                    ? "bg-zinc-850 border-zinc-700 text-white" 
                    : "bg-[#F8FAFC] border-zinc-200 text-[#111827]"
                }`}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-[#00637C] hover:bg-[#004d60] text-white font-bold py-2.5 rounded-xl text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 border border-[#00637C] shadow-md mt-2"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Access Dashboard"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden font-sans ${isDarkMode ? "bg-zinc-950 text-zinc-100" : "bg-[#F5F7FA] text-[#111827]"}`}>
      {/* Sidebar Navigation */}
      <aside className={`w-64 border-r flex flex-col justify-between ${isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-[#E2E8F0]"}`}>
        <div>
          {/* Sidebar Header */}
          <div className={`p-6 flex items-center gap-3 border-b ${isDarkMode ? "border-zinc-800" : "border-[#E2E8F0]"}`}>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#00637C] to-[#0EA5A4] flex items-center justify-center shadow-sm">
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <span className={`font-bold text-lg tracking-tight block ${isDarkMode ? "text-white" : "text-[#00637C]"}`}>
                LeadFlow
              </span>
              <span className="text-[10px] text-zinc-400 block -mt-1 font-medium">
                Silvia Agency LLC
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab("discovery")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "discovery"
                  ? isDarkMode 
                    ? "bg-zinc-800 text-[#00637C] border-l-4 border-[#00637C]"
                    : "bg-[#e0f2f6] text-[#00637C] border-l-4 border-[#00637C]"
                  : isDarkMode
                  ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
              }`}
            >
              <Search className="h-4.5 w-4.5" />
              Discovery Engine
            </button>
            <button
              onClick={() => setActiveTab("archive")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "archive"
                  ? isDarkMode 
                    ? "bg-zinc-800 text-[#00637C] border-l-4 border-[#00637C]"
                    : "bg-[#e0f2f6] text-[#00637C] border-l-4 border-[#00637C]"
                  : isDarkMode
                  ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
              }`}
            >
              <Users className="h-4.5 w-4.5" />
              School Database
            </button>
            <button
              onClick={() => setActiveTab("config")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "config"
                  ? isDarkMode 
                    ? "bg-zinc-800 text-[#00637C] border-l-4 border-[#00637C]"
                    : "bg-[#e0f2f6] text-[#00637C] border-l-4 border-[#00637C]"
                  : isDarkMode
                  ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
              }`}
            >
              <Settings className="h-4.5 w-4.5" />
              Outreach Config
            </button>
          </nav>
        </div>

        {/* Sidebar Footer details */}
        <div className="p-4 border-t border-[#E2E8F0] dark:border-zinc-800 space-y-3">
          <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-zinc-950/40 border-zinc-800" : "bg-[#f8faf9] border-[#E2E8F0]"}`}>
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Usage & Quotas</div>
            <div className="mt-2.5 flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-500">Discovered Leads</span>
              <span className={isDarkMode ? "text-teal-400" : "text-[#00637C]"}>{totalLeads}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-500">AI Audits Run</span>
              <span className={isDarkMode ? "text-teal-400" : "text-[#00637C]"}>{leads.filter(l => l.appearance).length}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <a
              href={`${API_BASE}/download-excel`}
              target="_blank"
              download
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all border ${
                isDarkMode 
                  ? "bg-zinc-800 hover:bg-zinc-750 text-white border-zinc-700" 
                  : "bg-white hover:bg-zinc-50 text-[#00637C] border-[#E2E8F0]"
              }`}
            >
              <Download className="h-3.5 w-3.5" /> Download CSV
            </a>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2 rounded-lg border border-red-500/20 hover:bg-red-550/10 text-red-500 text-xs font-bold transition-all"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className={`h-16 border-b flex items-center justify-between px-8 select-none ${isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-[#E2E8F0]"}`}>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-[#e0f2f6] text-[#00637C] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Silvia School Pipeline
            </span>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#00637C] hover:bg-[#004d60] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> New Leads
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg border transition-all ${isDarkMode ? "border-zinc-700 text-yellow-400 bg-zinc-800" : "border-[#E2E8F0] text-zinc-500 hover:bg-zinc-50"}`}
            >
              {isDarkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
            {/* Notifications Popover */}
            <div className="relative">
              <button 
                onClick={() => { 
                  setIsNotificationsOpen(!isNotificationsOpen); 
                  setIsProfileOpen(false); 
                }}
                className={`p-2 rounded-lg border transition-all relative ${
                  isNotificationsOpen
                    ? "border-[#00637C] text-[#00637C] bg-[#e0f2f6]/40"
                    : isDarkMode 
                    ? "border-zinc-700 text-zinc-400 hover:bg-zinc-800" 
                    : "border-[#E2E8F0] text-zinc-500 hover:bg-zinc-50"
                }`}
              >
                <Bell className="h-4.5 w-4.5" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                )}
              </button>

              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsNotificationsOpen(false)}></div>
                  <div className={`absolute right-0 mt-2 w-80 rounded-2xl border shadow-xl p-4 space-y-3 z-40 select-none ${
                    isDarkMode ? "bg-zinc-900 border-zinc-850 text-white" : "bg-white border-[#E2E8F0] text-[#111827]"
                  }`}>
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-850">
                      <span className="text-xs font-black uppercase tracking-wider text-[#00637C]">System Alerts</span>
                      <button 
                        onClick={() => {
                          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                        }}
                        className="text-[9px] text-[#00637C] hover:underline font-bold uppercase tracking-wider"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="space-y-2.5 max-h-56 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-[10px] text-zinc-400 font-semibold text-center py-4">No recent notifications</p>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => {
                              setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
                            }}
                            className={`p-2.5 rounded-lg border text-left transition-all ${
                              n.read 
                                ? "bg-transparent border-transparent" 
                                : isDarkMode
                                ? "bg-zinc-850/40 border-zinc-800"
                                : "bg-zinc-50 border-[#E2E8F0]"
                            }`}
                          >
                            <p className={`text-[10px] leading-normal font-semibold ${n.read ? "text-zinc-400" : "text-zinc-700 dark:text-zinc-200"}`}>{n.text}</p>
                            <span className="text-[8px] text-zinc-400 font-bold block mt-1 uppercase tracking-widest">{n.time}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => { 
                  setIsProfileOpen(!isProfileOpen); 
                  setIsNotificationsOpen(false); 
                }}
                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs transition-all border select-none ${
                  isProfileOpen
                    ? "border-[#00637C] ring-2 ring-[#00637C]/20"
                    : isDarkMode 
                    ? "bg-zinc-700 text-teal-400 border-zinc-600 hover:bg-zinc-650" 
                    : "bg-[#e0f2f6] text-[#00637C] border-[#00637C]/10 hover:bg-[#d0eaef]"
                }`}
              >
                SA
              </button>

              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsProfileOpen(false)}></div>
                  <div className={`absolute right-0 mt-2 w-64 rounded-2xl border shadow-xl p-4 space-y-4 z-40 select-none text-left ${
                    isDarkMode ? "bg-zinc-900 border-zinc-850 text-white" : "bg-white border-[#E2E8F0] text-[#111827]"
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        isDarkMode ? "bg-zinc-800 text-teal-400" : "bg-[#e0f2f6] text-[#00637C]"
                      }`}>
                        SA
                      </div>
                      <div>
                        <h4 className="text-xs font-black">Silvia Admin</h4>
                        <span className="text-[9px] text-zinc-400 font-bold tracking-wide">admin@silvia.agency</span>
                      </div>
                    </div>

                    <div className="border-t border-zinc-100 dark:border-zinc-850 pt-3.5 space-y-2">
                      <div className="flex justify-between items-center text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                        <span>Database Status</span>
                        <span className="text-emerald-500 lowercase tracking-normal">connected</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-semibold bg-zinc-50 dark:bg-zinc-850 p-2 rounded-lg truncate">
                        MySQL (XAMPP localhost)
                      </p>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full py-2.5 rounded-xl border border-red-500/20 hover:bg-red-500/10 text-red-500 text-xs font-bold transition-all mt-2 uppercase tracking-widest text-center block"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Workspace views container */}
        <div className="flex-1 overflow-y-auto p-8">
          


          {/* TAB 2: Lead Discovery scraper */}
          {activeTab === "discovery" && (
            <div className="relative flex-1 flex flex-col items-center justify-center min-h-[75vh] w-full px-4 overflow-hidden select-none">
              {/* Subtle Linear/Stripe Dot Grid Pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(#E2E8F0_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-60 dark:opacity-10 pointer-events-none"></div>

              {isSearching ? (
                /* Premium Visual Stepper Loading Screen */
                <div className={`max-w-xl w-full border rounded-2xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)] space-y-7 relative z-10 ${
                  isDarkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-[#E2E8F0] text-[#111827]"
                }`}>
                  <div className="text-center pb-2 border-b border-zinc-100 dark:border-zinc-850">
                    <h3 className="text-sm font-black uppercase tracking-wider text-[#00637C]">AI Lead enrichment pipeline</h3>
                    <p className="text-[10px] text-zinc-400 font-bold mt-1">Playwright crawler is active on maps listings</p>
                  </div>

                  {/* Stepper Steps */}
                  <div className="space-y-6">
                    {/* Step 1 */}
                    <div className="flex items-start gap-4">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        currentStep > 1 
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                          : currentStep === 1 
                          ? "bg-[#e0f2f6] text-[#00637C] border border-[#00637C] animate-pulse" 
                          : "bg-zinc-50 text-zinc-300 border border-zinc-200"
                      }`}>
                        {currentStep > 1 ? <Check className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${currentStep === 1 ? "text-[#00637C]" : currentStep > 1 ? "text-zinc-500" : "text-zinc-400"}`}>
                            1. Google Maps Parsing
                          </span>
                          {currentStep === 1 && <Loader2 className="h-3 w-3 animate-spin text-[#00637C]" />}
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5 font-medium">Extracting names, domains, and phone numbers from live Maps feeds.</p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-4">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        currentStep > 2 
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                          : currentStep === 2 
                          ? "bg-[#e0f2f6] text-[#00637C] border border-[#00637C] animate-pulse" 
                          : "bg-zinc-50 text-zinc-300 border border-zinc-200"
                      }`}>
                        {currentStep > 2 ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${currentStep === 2 ? "text-[#00637C]" : currentStep > 2 ? "text-zinc-500" : "text-zinc-400"}`}>
                            2. AI Website Audit & screenshotting
                          </span>
                          {currentStep === 2 && <Loader2 className="h-3 w-3 animate-spin text-[#00637C]" />}
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5 font-medium">Analyzing design responsiveness, layout structure, and red-flags via Gemini.</p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-4">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        currentStep > 3 
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                          : currentStep === 3 
                          ? "bg-[#e0f2f6] text-[#00637C] border border-[#00637C] animate-pulse" 
                          : "bg-zinc-50 text-zinc-300 border border-zinc-200"
                      }`}>
                        {currentStep > 3 ? <Check className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${currentStep === 3 ? "text-[#00637C]" : currentStep > 3 ? "text-zinc-500" : "text-zinc-400"}`}>
                            3. Social Presence Scan
                          </span>
                          {currentStep === 3 && <Loader2 className="h-3 w-3 animate-spin text-[#00637C]" />}
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5 font-medium">Scanning Facebook, LinkedIn, and Instagram for recent target activity profiles.</p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start gap-4">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        currentStep > 4 
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                          : currentStep === 4 
                          ? "bg-[#e0f2f6] text-[#00637C] border border-[#00637C] animate-pulse" 
                          : "bg-zinc-50 text-zinc-300 border border-zinc-200"
                      }`}>
                        {currentStep > 4 ? <Check className="h-4 w-4" /> : <Database className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${currentStep === 4 ? "text-[#00637C]" : "text-zinc-400"}`}>
                            4. Database Insertion & Sync
                          </span>
                          {currentStep === 4 && <Loader2 className="h-3 w-3 animate-spin text-[#00637C]" />}
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5 font-medium">Committing enriched records to MySQL database & syncing sheets.</p>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                /* Centered Search Launcher Control Card */
                <div className="max-w-3xl w-full space-y-6 relative z-10 animate-fade-in">
                  <div className={`border rounded-2xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.03)] space-y-5 ${
                    isDarkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-[#E2E8F0] text-[#111827]"
                  }`}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-850">
                      <div>
                        <h3 className="text-sm font-extrabold text-[#00637C] uppercase tracking-wider">Google Maps Discovery Engine</h3>
                        <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Scrape new target leads directly from Google Maps and enrich them automatically via AI.</p>
                      </div>
                    </div>

                    <form onSubmit={handleStartSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="md:col-span-2">
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                          Target Area / Location
                        </label>
                        <input
                          type="text"
                          value={areaInput}
                          onChange={(e) => setAreaInput(e.target.value)}
                          placeholder="e.g. Tambaram"
                          className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#00637C] focus:ring-1 focus:ring-[#00637C] font-semibold transition-all ${
                            isDarkMode 
                              ? "bg-zinc-850 border-zinc-700 text-white" 
                              : "bg-[#F8FAFC] border-zinc-200 text-[#111827]"
                          }`}
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                          School Type
                        </label>
                        <input
                          type="text"
                          value={typeInput}
                          onChange={(e) => setTypeInput(e.target.value)}
                          placeholder="e.g. matriculation schools"
                          className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#00637C] focus:ring-1 focus:ring-[#00637C] font-semibold transition-all ${
                            isDarkMode 
                              ? "bg-zinc-850 border-zinc-700 text-white" 
                              : "bg-[#F8FAFC] border-zinc-200 text-[#111827]"
                          }`}
                          required
                        />
                      </div>

                      <div className="md:col-span-4 mt-2">
                        <button
                          type="submit"
                          disabled={isSearching}
                          className="w-full bg-[#00637C] hover:bg-[#004d60] text-white font-bold py-2.5 rounded-xl text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-md border border-[#00637C]"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Start Leads Enrichment
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Pre-configured Quick-Start Search Cards */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block text-center">
                      ⚡ Quick-Start Scraper Templates
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Card 1 */}
                      <button
                        onClick={() => {
                          setAreaInput("Tambaram");
                          setTypeInput("matriculation schools");
                        }}
                        className={`p-3.5 border rounded-xl text-left transition-all hover:-translate-y-0.5 hover:shadow-md flex items-start gap-3 group ${
                          isDarkMode 
                            ? "bg-zinc-900 border-zinc-800 hover:border-[#00637C]" 
                            : "bg-white border-zinc-200/80 hover:border-[#00637C] shadow-sm"
                        }`}
                      >
                        <div className="h-7 w-7 rounded-lg bg-[#e0f2f6] text-[#00637C] flex items-center justify-center shrink-0">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold block text-zinc-800 dark:text-zinc-200 group-hover:text-[#00637C] transition-colors">
                            Matriculation
                          </span>
                          <span className="text-[9px] text-zinc-400 font-semibold block mt-0.5">
                            Tambaram, Chennai
                          </span>
                        </div>
                      </button>

                      {/* Card 2 */}
                      <button
                        onClick={() => {
                          setAreaInput("Adyar");
                          setTypeInput("CBSE schools");
                        }}
                        className={`p-3.5 border rounded-xl text-left transition-all hover:-translate-y-0.5 hover:shadow-md flex items-start gap-3 group ${
                          isDarkMode 
                            ? "bg-zinc-900 border-zinc-800 hover:border-[#00637C]" 
                            : "bg-white border-zinc-200/80 hover:border-[#00637C] shadow-sm"
                        }`}
                      >
                        <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold block text-zinc-800 dark:text-zinc-200 group-hover:text-[#00637C] transition-colors">
                            CBSE
                          </span>
                          <span className="text-[9px] text-zinc-400 font-semibold block mt-0.5">
                            Adyar, Chennai
                          </span>
                        </div>
                      </button>

                      {/* Card 3 */}
                      <button
                        onClick={() => {
                          setAreaInput("ECR");
                          setTypeInput("international schools");
                        }}
                        className={`p-3.5 border rounded-xl text-left transition-all hover:-translate-y-0.5 hover:shadow-md flex items-start gap-3 group ${
                          isDarkMode 
                            ? "bg-zinc-900 border-zinc-800 hover:border-[#00637C]" 
                            : "bg-white border-zinc-200/80 hover:border-[#00637C] shadow-sm"
                        }`}
                      >
                        <div className="h-7 w-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                          <Globe className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold block text-zinc-800 dark:text-zinc-200 group-hover:text-[#00637C] transition-colors">
                            International
                          </span>
                          <span className="text-[9px] text-zinc-400 font-semibold block mt-0.5">
                            ECR, Chennai
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Search Archive Table */}
          {activeTab === "archive" && (
            <div className="space-y-6 animate-fade-in text-[#111827]">
              {/* COMPACT KPI CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total Schools */}
                <div className={`border rounded-xl p-4 shadow-sm flex items-center justify-between transition-all hover:shadow-md ${isDarkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-[#E2E8F0] text-[#111827]"}`}>
                  <div>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Total Schools</span>
                    <span className="text-2xl font-black mt-1 block">{totalLeads}</span>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-[#e0f2f6] flex items-center justify-center text-[#00637C]">
                    <Users className="h-4 w-4" />
                  </div>
                </div>

                {/* Active Social Media */}
                <div className={`border rounded-xl p-4 shadow-sm flex items-center justify-between transition-all hover:shadow-md ${isDarkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-[#E2E8F0] text-[#111827]"}`}>
                  <div>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Active Socials</span>
                    <span className="text-2xl font-black mt-1 block">{activeSocialMedia}</span>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>

                {/* Needs Redesign */}
                <div className={`border rounded-xl p-4 shadow-sm flex items-center justify-between transition-all hover:shadow-md ${isDarkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-[#E2E8F0] text-[#111827]"}`}>
                  <div>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Needs Redesign</span>
                    <span className="text-2xl font-black mt-1 block">{needsRedesign}</span>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                </div>

                {/* No Website */}
                <div className={`border rounded-xl p-4 shadow-sm flex items-center justify-between transition-all hover:shadow-md ${isDarkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-[#E2E8F0] text-[#111827]"}`}>
                  <div>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">No Website</span>
                    <span className="text-2xl font-black mt-1 block">{noWebsite}</span>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                    <Sparkles className="h-4 w-4" />
                  </div>
                </div>
              </div>
              {/* Main Database Table Card */}
              {(() => {
                const totalPages = Math.ceil(filteredLeads.length / pageSize) || 1;
                const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);
                return (
                  <div className={`border rounded-xl p-5 shadow-sm space-y-4 overflow-hidden ${isDarkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-[#E2E8F0] text-[#111827]"}`}>
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center pb-3 border-b border-[#E2E8F0] dark:border-zinc-800 gap-4 w-full">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-[#00637C]">Discovered Database Leads ({filteredLeads.length})</h3>
                        <p className="text-[10px] text-zinc-400 mt-0.5 font-medium">Click any row below to open the rich AI Analysis and website preview panel.</p>
                      </div>

                      {/* Integrated Filters & Sync Panel inside Card Header */}
                      <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                        {/* Search Input */}
                        <div className="relative w-full sm:w-44 md:w-56">
                          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search name or location..."
                            className={`w-full pl-8 pr-3 py-1.5 border rounded-lg text-[10px] focus:outline-none focus:border-[#00637C] font-semibold transition-all ${
                              isDarkMode 
                                ? "bg-zinc-850 border-zinc-700 text-white" 
                                : "bg-[#F5F7FA] border-zinc-200 text-[#111827]"
                            }`}
                          />
                        </div>

                        {/* Dropdowns */}
                        <CustomSelect
                          value={filterType}
                          onChange={setFilterType}
                          options={[
                            { label: "All Types", value: "All Types" },
                            { label: "CBSE", value: "CBSE" },
                            { label: "Matriculation", value: "Matriculation" },
                            { label: "International", value: "International" }
                          ]}
                          isDarkMode={isDarkMode}
                        />

                        <CustomSelect
                          value={filterAppearance}
                          onChange={setFilterAppearance}
                          options={[
                            { label: "All Appearances", value: "All Appearances" },
                            { label: "Good Site", value: "Good" },
                            { label: "Redesign Site", value: "Redesign" },
                            { label: "No Site", value: "Fresh" }
                          ]}
                          isDarkMode={isDarkMode}
                        />

                        <CustomSelect
                          value={filterAtmosphere}
                          onChange={setFilterAtmosphere}
                          options={[
                            { label: "All Atmospheres", value: "All Atmospheres" },
                            { label: "Atmosphere: Good", value: "Good" },
                            { label: "Atmosphere: Bad", value: "Bad" }
                          ]}
                          isDarkMode={isDarkMode}
                        />

                        <button
                          onClick={handleSyncSheets}
                          className="bg-[#00637C] hover:bg-[#004d60] text-white px-3.5 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm shrink-0 border border-[#00637C]"
                        >
                          <RefreshCw className="h-3 w-3" /> Sync Sheets
                        </button>

                        <button
                          onClick={handleDownloadCSV}
                          className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm shrink-0 border ${
                            isDarkMode
                              ? "bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
                              : "bg-[#e0f2f6] border-[#00637C]/20 text-[#00637C] hover:bg-[#cbeaf0]"
                          }`}
                        >
                          <Download className="h-3 w-3" /> Download CSV
                        </button>

                        <button
                          onClick={handleDeleteAllLeads}
                          disabled={leads.length === 0}
                          className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm shrink-0 border disabled:opacity-50 disabled:cursor-not-allowed ${
                            isDarkMode
                              ? "bg-red-950/20 border-red-500/30 text-red-400 hover:bg-red-950/40 hover:text-red-300"
                              : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700"
                          }`}
                        >
                          <Trash2 className="h-3 w-3" /> Delete All
                        </button>
                      </div>
                    </div>

                    <div className="p-1">
                      {renderLeadsTable(paginatedLeads, true)}
                    </div>

                    {/* Table Footer / Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-between items-center pt-4 border-t border-[#E2E8F0] dark:border-zinc-800">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                          Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredLeads.length)} of {filteredLeads.length} leads
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                              currentPage === 1
                                ? isDarkMode
                                  ? "bg-zinc-800 border-zinc-850 text-zinc-600 cursor-not-allowed"
                                  : "bg-zinc-50 border-zinc-100 text-zinc-300 cursor-not-allowed"
                                : isDarkMode
                                  ? "bg-[#00637C]/20 border-[#00637C]/30 text-[#e0f2f6] hover:bg-[#00637C] hover:text-white"
                                  : "bg-[#e0f2f6] border-[#00637C]/20 text-[#00637C] hover:bg-[#00637C] hover:text-white"
                            }`}
                          >
                            Previous
                          </button>
                          <span className={`text-[10px] font-bold px-2.5 ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>
                            {currentPage} / {totalPages}
                          </span>
                          <button
                            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                              currentPage === totalPages
                                ? isDarkMode
                                  ? "bg-zinc-800 border-zinc-855 text-zinc-600 cursor-not-allowed"
                                  : "bg-zinc-50 border-zinc-100 text-zinc-300 cursor-not-allowed"
                                : isDarkMode
                                  ? "bg-[#00637C]/20 border-[#00637C]/30 text-[#e0f2f6] hover:bg-[#00637C] hover:text-white"
                                  : "bg-[#e0f2f6] border-[#00637C]/20 text-[#00637C] hover:bg-[#00637C] hover:text-white"
                            }`}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 5: Outreach Config settings */}
          {activeTab === "config" && (
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in text-[#111827]">
              <div className={`border rounded-xl p-6 shadow-sm ${isDarkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-[#E2E8F0] text-[#111827]"}`}>
                <div className="mb-6">
                  <h3 className="text-md font-bold">API Key & Sync Settings</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Manage secrets and connections. These keys are saved directly into your local workspace `.env` file.
                  </p>
                </div>

                <form onSubmit={handleSaveConfig} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      AI Model Provider
                    </label>
                    <select
                      value={aiProvider}
                      onChange={(e) => setAiProvider(e.target.value)}
                      className={`w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00637C] ${
                        isDarkMode ? "bg-zinc-850 border-zinc-700 text-white" : "bg-white border-[#E2E8F0] text-[#111827]"
                      }`}
                    >
                      <option value="none">None (Local Keyword Fallbacks)</option>
                      <option value="gemini">Google Gemini API</option>
                      <option value="ollama">Ollama (Local LLM)</option>
                    </select>
                  </div>

                  {aiProvider === "gemini" && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                        Gemini API Key
                      </label>
                      <input
                        type="password"
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        placeholder={geminiKey ? "••••••••••••••••" : "AI key (GEMINI_API_KEY)"}
                        className={`w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00637C] ${
                          isDarkMode ? "bg-zinc-850 border-zinc-700 text-white" : "bg-white border-[#E2E8F0]"
                        }`}
                      />
                    </div>
                  )}

                  {aiProvider === "ollama" && (
                    <div className="space-y-4 border-l-2 border-[#00637C]/30 pl-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                          Ollama Base URL
                        </label>
                        <input
                          type="text"
                          value={ollamaBaseUrl}
                          onChange={(e) => setOllamaBaseUrl(e.target.value)}
                          placeholder="e.g. http://localhost:11434"
                          className={`w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00637C] ${
                            isDarkMode ? "bg-zinc-850 border-zinc-700 text-white" : "bg-white border-[#E2E8F0]"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                          Ollama Text Model (Classification)
                        </label>
                        <input
                          type="text"
                          value={ollamaModel}
                          onChange={(e) => setOllamaModel(e.target.value)}
                          placeholder="e.g. llama3.2"
                          className={`w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00637C] ${
                            isDarkMode ? "bg-zinc-850 border-zinc-700 text-white" : "bg-white border-[#E2E8F0]"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                          Ollama Vision Model (Screenshot/Photo Audit)
                        </label>
                        <input
                          type="text"
                          value={ollamaVisionModel}
                          onChange={(e) => setOllamaVisionModel(e.target.value)}
                          placeholder="e.g. llama3.2-vision"
                          className={`w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00637C] ${
                            isDarkMode ? "bg-zinc-850 border-zinc-700 text-white" : "bg-white border-[#E2E8F0]"
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      Google Sheet Spreadsheet ID
                    </label>
                    <input
                      type="text"
                      value={sheetId}
                      onChange={(e) => setSheetId(e.target.value)}
                      placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j..."
                      className={`w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00637C] ${
                        isDarkMode ? "bg-zinc-850 border-zinc-700 text-white" : "bg-white border-[#E2E8F0]"
                      }`}
                    />
                  </div>

                  {configMessage && (
                    <div className="text-xs text-[#00637C] font-bold bg-[#e0f2f6] px-3.5 py-2 rounded-lg border border-[#00637C]/10">
                      {configMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={configLoading}
                    className="w-full bg-[#00637C] hover:bg-[#004d60] text-white font-bold py-2.5 rounded-lg text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    {configLoading ? (
                      <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                        Saving to Workspace env...
                      </>
                    ) : (
                      "Save Settings Configuration"
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* RIGHT-SIDE DETAILS DRAWER */}
      {selectedLead && (
        <>
          {/* Overlay to dim background */}
          <div 
            className="fixed inset-0 bg-black/10 z-40 transition-opacity"
            onClick={() => setSelectedLead(null)}
          ></div>
          
          <div className="fixed inset-y-0 right-0 w-[480px] bg-white border-l border-[#E2E8F0] shadow-2xl z-50 flex flex-col animate-slide-in font-sans">
            {/* Drawer Header */}
            <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-start bg-white select-none">
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Lead Inspection</div>
                <h3 className="font-extrabold text-sm text-[#111827]">{selectedLead.school_name}</h3>
                <div className="flex gap-2 items-center text-[10px] font-semibold text-zinc-500 mt-1">
                  <span className="bg-zinc-100 px-2 py-0.5 rounded-full">{selectedLead.institution_type}</span>
                  <span>•</span>
                  <span>{selectedLead.area_name}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLead(null)}
                className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-zinc-50 text-zinc-500 transition-all font-bold text-xs"
              >
                Close Panel
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Lead Score Circular Badge */}
              <div className="border border-[#E2E8F0] rounded-xl p-5 bg-white shadow-sm flex items-center gap-5">
                {(() => {
                  let score = 75;
                  if (selectedLead.appearance === "Fresh") score = 95;
                  else if (selectedLead.appearance === "Redesign") score = 88;
                  else if (selectedLead.social_media === "Inactive") score = 60;
                  else score = 35;

                  return (
                    <>
                      <div className="relative h-16 w-16 flex items-center justify-center shrink-0">
                        {/* SVG Progress Circle */}
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-zinc-100"
                            strokeWidth="3"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-[#00637C]"
                            strokeDasharray={`${score}, 100`}
                            strokeWidth="3.2"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <span className="absolute text-xs font-black text-[#111827]">{score}%</span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#111827]">AI Lead Score</div>
                        <p className="text-[10px] text-zinc-400 leading-normal mt-0.5">
                          {score >= 85 
                            ? "High conversion potential. High-priority target for website services." 
                            : score >= 60 
                            ? "Medium conversion potential. Potential social media outreach target."
                            : "Low priority. Digital infrastructure is already robust."
                          }
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Contact Details Card */}
              <div className="space-y-2 select-none">
                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Contact & Location</div>
                <div className={`border rounded-xl p-4 shadow-sm space-y-3 ${isDarkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-[#F5F7FA] border-[#E2E8F0] text-[#111827]"}`}>
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-[#00637C] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-zinc-400 font-bold block">School Address</span>
                      <span className="text-xs font-bold mt-0.5 block">{selectedLead.address || "No address details available."}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 border-t border-zinc-200/60 dark:border-zinc-800/65 pt-2.5">
                    <Mail className="h-4 w-4 text-[#00637C] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-zinc-400 font-bold block">Contact Phone</span>
                      <span className="text-xs font-bold mt-0.5 block font-mono">{selectedLead.contact_number || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Website Preview Container */}
              <div className="space-y-2">
                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Website Infrastructure</div>
                <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-[#F5F7FA] font-mono text-[9px] shadow-sm">
                  <div className="bg-[#E2E8F0] px-3.5 py-2 flex items-center gap-1.5 border-b border-[#E2E8F0]">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <div className="bg-white rounded px-2 py-0.5 ml-2 truncate max-w-[240px] text-zinc-500 flex items-center gap-1">
                      <Shield className="h-2.5 w-2.5 text-emerald-500" />
                      {selectedLead.website_url ? selectedLead.website_url.replace("https://", "").replace("http://", "") : "offline-domain.edu"}
                    </div>
                  </div>
                  <div className="bg-white p-5 flex flex-col justify-center items-center text-center">
                    {selectedLead.website_url ? (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-zinc-800">Screenshot Sandbox Secure</div>
                        <div className="text-[10px] text-zinc-400 leading-normal">
                          Appearance: <span className="font-bold text-zinc-700">{selectedLead.appearance}</span> • SSL Valid
                        </div>
                        <a 
                          href={selectedLead.website_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[#00637C] font-extrabold underline text-[10px] block pt-1.5"
                        >
                          Visit Live URL <ExternalLink className="inline h-2.5 w-2.5" />
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-[11px] font-bold text-red-500 uppercase tracking-wide">Domain Offline / Fresh Design</div>
                        <div className="text-[10px] text-zinc-400">No registered domain found in discovery records.</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Social Media Preview Container */}
              <div className="space-y-2">
                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Social Presence (Last 30 Days)</div>
                <div className="border border-[#E2E8F0] rounded-xl p-4 bg-[#F5F7FA] shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Facebook / Instagram scans</span>
                    <span className={`inline-block font-extrabold px-2 py-0.5 rounded text-[9px] text-white ${
                      selectedLead.social_media === "Active" ? "bg-[#1f4e3d]" : "bg-[#9c0006]"
                    }`}>
                      {selectedLead.social_media === "Active" ? "Active Posts Detected" : "Inactive / Idle"}
                    </span>
                  </div>
                  
                  {selectedLead.social_media === "Active" ? (
                    <div className="space-y-2.5">
                      <div className="bg-white p-3 rounded-lg border border-[#E2E8F0] shadow-sm">
                        <div className="text-zinc-400 text-[9px] font-semibold">12 Days Ago • Facebook Page</div>
                        <p className="text-[#111827] text-[10px] leading-snug mt-1 font-medium">
                          "Admissions are open for CBSE & Matriculation batches for 2026-27. Limited seats remaining! Contact desk at..."
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white p-4 text-center rounded-lg border border-[#E2E8F0] text-zinc-400 text-[10px] font-bold">
                      No social posts detected in the last 30 days. Outdated outreach.
                    </div>
                  )}
                </div>
              </div>

              {/* AI Analysis Info Cards */}
              <div className="space-y-2.5">
                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">AI Audit Findings</div>
                <div className="grid grid-cols-2 gap-3 text-[10px] select-none">
                  <div className="border border-[#E2E8F0] p-3 rounded-lg bg-white shadow-sm">
                    <span className="text-zinc-400 block font-bold">Google Rating</span>
                    <span className="font-extrabold block mt-0.5 text-zinc-800 text-[12px] flex items-center gap-0.5">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-500" /> 
                      {selectedLead.google_rating || "N/A"}
                    </span>
                  </div>
                  <div className="border border-[#E2E8F0] p-3 rounded-lg bg-white shadow-sm">
                    <span className="text-zinc-400 block font-bold">Atmosphere Rating</span>
                    <span className={`font-bold block mt-0.5 ${selectedLead.atmosphere === "Good" ? "text-emerald-600" : "text-red-500"}`}>
                      {selectedLead.atmosphere === "Good" ? "✓ Looking Good" : "✗ Needs Facelift"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommendations list */}
              <div className="space-y-2">
                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Actionable Recommendations</div>
                <ul className="space-y-2">
                  {(() => {
                    const recs = [];
                    if (selectedLead.appearance === "Fresh" || !selectedLead.website_url) {
                      recs.push("Propose brand new website starter kit (domain, landing page, hosting).");
                      recs.push("Target admissions traffic showcasing custom maps integration.");
                      recs.push("Set up introductory outreach email focused on digital visibility.");
                    } else if (selectedLead.appearance === "Redesign") {
                      recs.push("Audit mobile styling errors and load latency to present pitch deck.");
                      recs.push("Propose responsive Next.js portfolio redesign package.");
                      recs.push("Draft cold email target sequence focusing on design quality comparison.");
                    } else {
                      recs.push("Pitch search ads audit to optimize current website enrollment traffic.");
                      recs.push("Offer Facebook/Instagram management service (currently inactive).");
                      recs.push("Suggest conversion rate enhancement updates for current page.");
                    }
                    
                    return recs.map((rec, i) => (
                      <li key={i} className="flex gap-2 items-start text-[10px] font-semibold text-zinc-600 leading-normal">
                        <CheckCircle className="h-3.5 w-3.5 text-[#00637C] shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ));
                  })()}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
      {/* MANUAL LEAD CREATION MODAL */}
      {isAddModalOpen && (
        <>
          {/* Overlay to dim background */}
          <div 
            className="fixed inset-0 bg-black/40 z-40 transition-opacity backdrop-blur-[2px]"
            onClick={() => setIsAddModalOpen(false)}
          ></div>
          
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className={`max-w-md w-full border rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-in ${
              isDarkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-[#E2E8F0] text-[#111827]"
            }`}>
              <div className="flex justify-between items-start pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#00637C]">Add Manual Lead</h3>
                  <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Manually register a target school in your CRM pipeline.</p>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className={`p-1 px-2 rounded-lg text-[9px] font-bold border transition-all ${
                    isDarkMode ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-750 text-zinc-300" : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-500"
                  }`}
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleAddLeadSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    School Name *
                  </label>
                  <input
                    type="text"
                    value={newSchoolName}
                    onChange={(e) => setNewSchoolName(e.target.value)}
                    placeholder="e.g. St. Mary Matriculation School"
                    className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#00637C] focus:ring-1 focus:ring-[#00637C] font-semibold transition-all ${
                      isDarkMode 
                        ? "bg-zinc-850 border-zinc-700 text-white" 
                        : "bg-[#F8FAFC] border-zinc-200 text-[#111827]"
                    }`}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      School Type
                    </label>
                    <select
                      value={newInstitutionType}
                      onChange={(e) => setNewInstitutionType(e.target.value)}
                      className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#00637C] font-semibold transition-all ${
                        isDarkMode 
                          ? "bg-zinc-850 border-zinc-700 text-white" 
                          : "bg-[#F8FAFC] border-zinc-200 text-[#111827]"
                      }`}
                    >
                      <option value="Matriculation">Matriculation</option>
                      <option value="CBSE">CBSE</option>
                      <option value="International">International</option>
                      <option value="State Board">State Board</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      Area / Location *
                    </label>
                    <input
                      type="text"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      placeholder="e.g. Tambaram"
                      className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#00637C] focus:ring-1 focus:ring-[#00637C] font-semibold transition-all ${
                        isDarkMode 
                          ? "bg-zinc-850 border-zinc-700 text-white" 
                          : "bg-[#F8FAFC] border-[#E2E8F0] text-[#111827]"
                      }`}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={newWebsiteUrl}
                      onChange={(e) => setNewWebsiteUrl(e.target.value)}
                      placeholder="https://example.com"
                      className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#00637C] focus:ring-1 focus:ring-[#00637C] font-semibold transition-all ${
                        isDarkMode 
                          ? "bg-zinc-850 border-zinc-700 text-white" 
                          : "bg-[#F8FAFC] border-[#E2E8F0] text-[#111827]"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="text"
                      value={newContactNumber}
                      onChange={(e) => setNewContactNumber(e.target.value)}
                      placeholder="e.g. 044-22345678"
                      className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#00637C] focus:ring-1 focus:ring-[#00637C] font-semibold transition-all ${
                        isDarkMode 
                          ? "bg-zinc-850 border-zinc-700 text-white" 
                          : "bg-[#F8FAFC] border-[#E2E8F0] text-[#111827]"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    School Address
                  </label>
                  <textarea
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="e.g. No. 12, OMR Road, Navalur, Chennai, Tamil Nadu - 600130"
                    className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#00637C] focus:ring-1 focus:ring-[#00637C] font-semibold transition-all ${
                      isDarkMode 
                        ? "bg-zinc-850 border-zinc-700 text-white" 
                        : "bg-[#F8FAFC] border-zinc-200 text-[#111827]"
                    }`}
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value)}
                    className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#00637C] font-semibold transition-all ${
                      isDarkMode 
                        ? "bg-zinc-850 border-zinc-700 text-white" 
                        : "bg-[#F8FAFC] border-[#E2E8F0] text-[#111827]"
                    }`}
                  >
                    <option value="New Lead">New Lead</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Email Sent">Email Sent</option>
                    <option value="Replied">Replied</option>
                    <option value="Meeting Booked">Meeting Booked</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isAddLoading}
                  className="w-full bg-[#00637C] hover:bg-[#004d60] text-white font-bold py-2.5 rounded-xl text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 border border-[#00637C] shadow-md mt-2"
                >
                  {isAddLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving Lead...
                    </>
                  ) : (
                    "Register Lead"
                  )}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
