import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  FileChartColumn,
  Image,
  LoaderCircle,
  Pill,
  RefreshCw,
  ScanLine,
  Trash2,
  Upload,
  VideoOff,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SafetyBanner from '../components/SafetyBanner.jsx';
import { analysisTypes } from '../data/analysisTypes.js';
import { clearLastResult, setLastResult } from '../utils/storage.js';
import { INVALID_DOCUMENT_MESSAGE, validateMedicalDocument } from '../utils/medicalDocumentValidation.js';
import { extractMedicalDocument } from '../utils/prescriptionExtraction.js';
import { getSupabaseClient } from '../lib/supabaseClient.js';

const typeIcons = {
  prescription: ScanLine,
  medicine: Pill,
  report: FileChartColumn,
};

const documentLabels = {
  prescription: 'Prescription',
  lab_report: 'Lab report',
  medical_report: 'Medical report',
  medicine_label: 'Medicine label or strip',
};

const emptyValidation = {
  status: 'idle',
  message: '',
  reason: '',
  confidence: 0,
  documentType: 'unknown',
  medicalSignals: [],
  visualSignals: [],
  continued: false,
};

function AnalyzePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const uploadInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const previewUrlRef = useRef('');
  const validationControllerRef = useRef(null);
  const extractionControllerRef = useRef(null);
  const validationSequenceRef = useRef(0);
  const cameraRequestRef = useRef(0);
  const initialType = analysisTypes.some((item) => item.key === searchParams.get('type')) ? searchParams.get('type') : 'prescription';
  const [analysisType, setAnalysisType] = useState(initialType);
  const [file, setFile] = useState(null);
  const [fileSource, setFileSource] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [validation, setValidation] = useState(emptyValidation);
  const [loading, setLoading] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('');
  const [analysisError, setAnalysisError] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('idle');
  const [cameraError, setCameraError] = useState('');
  const [cameraNotice, setCameraNotice] = useState('');

  const replacePreview = useCallback((nextUrl) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = nextUrl;
    setPreviewUrl(nextUrl);
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const closeCamera = useCallback(() => {
    cameraRequestRef.current += 1;
    stopCamera();
    setCameraOpen(false);
    setCameraStatus('idle');
    setCameraError('');
  }, [stopCamera]);

  useEffect(() => () => {
    validationControllerRef.current?.abort();
    extractionControllerRef.current?.abort();
    cameraRequestRef.current += 1;
    stopCamera();
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, [stopCamera]);

  const runValidation = useCallback(async (selected, source, expectedType) => {
    validationControllerRef.current?.abort();
    const controller = new AbortController();
    validationControllerRef.current = controller;
    const sequence = validationSequenceRef.current + 1;
    validationSequenceRef.current = sequence;
    setValidation({ ...emptyValidation, status: 'validating', message: 'Checking medical document…' });

    try {
      const result = await validateMedicalDocument(selected, {
        expectedType,
        origin: source,
        signal: controller.signal,
      });
      if (!controller.signal.aborted && validationSequenceRef.current === sequence) setValidation(result);
    } catch (error) {
      if (error.name !== 'AbortError' && validationSequenceRef.current === sequence) {
        setValidation({
          ...emptyValidation,
          status: 'invalid',
          message: INVALID_DOCUMENT_MESSAGE,
          reason: 'The document could not be validated safely. Please try another image.',
        });
      }
    }
  }, []);

  const selectFile = useCallback((selected, source, expectedType = analysisType) => {
    if (!selected) return;
    extractionControllerRef.current?.abort();
    clearLastResult();
    setLoading(false);
    setAnalysisStage('');
    setAnalysisError('');
    setCameraNotice('');
    setFile(selected);
    setFileSource(source);
    replacePreview(URL.createObjectURL(selected));
    void runValidation(selected, source, expectedType);
  }, [analysisType, replacePreview, runValidation]);

  const handleFileInput = (event, source) => {
    const selected = event.target.files?.[0];
    event.target.value = '';
    selectFile(selected, source);
  };

  const clearSelection = () => {
    validationControllerRef.current?.abort();
    extractionControllerRef.current?.abort();
    validationSequenceRef.current += 1;
    clearLastResult();
    setFile(null);
    setFileSource('');
    setLoading(false);
    setAnalysisStage('');
    setAnalysisError('');
    setValidation(emptyValidation);
    replacePreview('');
    if (uploadInputRef.current) uploadInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const chooseAnalysisType = (nextType) => {
    setAnalysisType(nextType);
    if (file) void runValidation(file, fileSource, nextType);
  };

  const startWebcam = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraNotice('Camera capture is not supported on this device. Please upload an image instead.');
      return;
    }

    const request = cameraRequestRef.current + 1;
    cameraRequestRef.current = request;
    setCameraOpen(true);
    setCameraStatus('starting');
    setCameraError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1600 },
          height: { ideal: 1200 },
        },
      });

      if (cameraRequestRef.current !== request) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      setCameraStatus('ready');
      window.requestAnimationFrame(() => {
        if (!videoRef.current || cameraRequestRef.current !== request) return;
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {
          setCameraError('The camera preview could not start. Please upload an image instead.');
          setCameraStatus('error');
        });
      });
    } catch (error) {
      if (cameraRequestRef.current !== request) return;
      const denied = error.name === 'NotAllowedError' || error.name === 'SecurityError';
      setCameraError(denied
        ? 'Camera permission was not granted. Please allow access or upload an image instead.'
        : 'Camera capture is not supported on this device. Please upload an image instead.');
      setCameraStatus('error');
    }
  }, []);

  const openCamera = () => {
    setCameraNotice('');
    const mobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const supportsCaptureInput = cameraInputRef.current?.getAttribute('capture') === 'environment';

    if (mobileDevice && supportsCaptureInput) {
      cameraInputRef.current.click();
      return;
    }

    void startWebcam();
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth < 1 || video.videoHeight < 1) {
      setCameraError('The camera is still starting. Please wait a moment and try again.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setCameraError('The photo could not be captured. Please upload an image instead.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) {
      setCameraError('The photo could not be captured. Please try again.');
      return;
    }

    const capturedFile = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
    closeCamera();
    selectFile(capturedFile, 'camera');
  };

  const continueAnyway = () => {
    setValidation((current) => (current.status === 'borderline'
      ? { ...current, continued: true }
      : current));
  };

  const canAnalyze = Boolean(file)
    && (validation.status === 'valid' || (validation.status === 'borderline' && validation.continued))
    && !loading;

  const saveScanHistory = async (result) => {
    if (!user?.id) return;

    try {
      const client = await getSupabaseClient();
      if (!client) return;

      const { error } = await client.from('scan_history').insert({
        user_id: user.id,
        document_type: analysisType,
        title: result?.title || result?.documentTitle || `${analysisType} analysis`,
        raw_ocr_text: result?.rawOcrText || result?.ocrText || '',
        extracted_data: result,
        confidence: result?.confidence || null,
      });

      if (error) console.error('Scan history save failed:', error);
    } catch (error) {
      console.error('Scan history save failed:', error);
    }
  };

  const analyze = async () => {
    if (!canAnalyze) return;
    extractionControllerRef.current?.abort();
    const controller = new AbortController();
    extractionControllerRef.current = controller;
    clearLastResult();
    setLoading(true);
    setAnalysisError('');
    setAnalysisStage('preparing');

    try {
      const result = await extractMedicalDocument(file, {
        analysisType,
        validation,
        signal: controller.signal,
        onStage: setAnalysisStage,
      });
      if (controller.signal.aborted) return;
      setLastResult(result);
      await saveScanHistory(result);
      navigate('/results');
    } catch (error) {
      if (error.name !== 'AbortError') {
        setAnalysisError(error.message || 'The OCR extraction failed safely. No medical information was generated.');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setAnalysisStage('');
      }
    }
  };

  const analysisStageLabel = {
    preparing: 'Preparing image for OCR…',
    ocr: 'Reading visible text with OCR…',
    verifying: 'Verifying every extracted field…',
  }[analysisStage];

  const analyzeButtonLabel = loading
    ? analysisStageLabel || 'Running source-verified extraction…'
    : validation.status === 'validating'
    ? 'Validating document…'
    : validation.status === 'invalid'
        ? 'Choose a valid medical document'
        : validation.status === 'borderline' && !validation.continued
          ? 'Review validation before continuing'
        : 'Analyze with MediLens AI';

  return (
    <div className="px-5 pb-24 pt-32 sm:px-6 sm:pt-36">
      <PageHeader
        eyebrow="Secure Frontend Preview"
        title="Upload a medical document for clear AI-assisted analysis"
        description="MediLens reads the visible text with OCR first, then source-checks every structured field before anything can appear in results."
      />

      <div className="mx-auto mt-12 grid max-w-6xl gap-5 lg:grid-cols-[1.06fr_0.94fr]">
        <section className="premium-card rounded-[2rem] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">1. Select Analysis Type</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.045em] text-white">What are you uploading?</h2>
            </div>
            <ScanLine className="size-6 text-white/38" />
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {analysisTypes.map((item) => {
              const Icon = typeIcons[item.key];
              const selected = item.key === analysisType;
              return (
                <button
                  key={item.key}
                  className={`glass-pill flex min-h-14 items-center justify-center gap-2 px-3 text-sm font-semibold tracking-[-0.025em] transition ${selected ? 'border-white/42 bg-white/[0.15] text-white' : 'text-white/58 hover:text-white'}`}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => chooseAnalysisType(item.key)}
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="mt-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">2. Add Image</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button
                className="premium-card flex min-h-36 flex-col items-center justify-center rounded-[1.4rem] p-5 text-center transition hover:border-white/30 hover:bg-white/[0.08]"
                type="button"
                onClick={() => uploadInputRef.current?.click()}
              >
                <Upload className="size-6 text-white/70" />
                <span className="mt-3 text-sm font-semibold text-white">Upload Image</span>
                <span className="mt-1 text-xs text-white/38">JPG, PNG, or WEBP · max 10 MB</span>
              </button>
              <button
                className="premium-card flex min-h-36 flex-col items-center justify-center rounded-[1.4rem] p-5 text-center transition hover:border-white/30 hover:bg-white/[0.08]"
                type="button"
                onClick={openCamera}
              >
                <Camera className="size-6 text-white/70" />
                <span className="mt-3 text-sm font-semibold text-white">Use Camera</span>
                <span className="mt-1 text-xs text-white/38">Capture document or medicine</span>
              </button>
            </div>
            <input
              ref={uploadInputRef}
              className="hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Upload a medical document image"
              onChange={(event) => handleFileInput(event, 'upload')}
            />
            <input
              ref={cameraInputRef}
              className="hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              aria-label="Take a photo of a medical document"
              onChange={(event) => handleFileInput(event, 'camera')}
            />

            <AnimatePresence>
              {cameraNotice ? (
                <motion.div
                  className="mt-4 flex items-start gap-3 rounded-[1.2rem] border border-amber-200/20 bg-amber-100/[0.07] p-4 text-sm leading-6 text-amber-50/78"
                  role="status"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <VideoOff className="mt-0.5 size-4 shrink-0" />
                  {cameraNotice}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </section>

        <section className="premium-card flex min-h-[31rem] flex-col rounded-[2rem] p-5 sm:p-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">3. Preview & Validate</p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.045em] text-white">Selected image</h2>
          </div>

          <div className="mt-5 flex min-h-64 flex-1 items-center justify-center overflow-hidden rounded-[1.45rem] border border-white/13 bg-black/28">
            {previewUrl ? (
              <img className="h-full max-h-80 w-full object-contain p-3" src={previewUrl} alt="Selected medical document preview" />
            ) : (
              <div className="flex flex-col items-center px-8 text-center">
                <Image className="size-10 text-white/26" />
                <p className="mt-3 text-sm font-medium text-white/48">Your prescription, report, or medicine image will appear here</p>
              </div>
            )}
          </div>

          {file ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-xs text-white/42">{file.name}</p>
              <div className="flex items-center gap-2">
                {fileSource === 'camera' ? (
                  <button className="glass-pill flex min-h-11 items-center gap-2 px-4 text-xs font-semibold text-white/72" type="button" onClick={openCamera}>
                    <RefreshCw className="size-3.5" /> Retake
                  </button>
                ) : null}
                <button className="glass-pill flex min-h-11 items-center gap-2 px-4 text-xs font-semibold text-white/72" type="button" onClick={clearSelection}>
                  <Trash2 className="size-3.5" /> Remove
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-4 min-h-[5.5rem]" aria-live="polite">
            <AnimatePresence mode="wait">
              {validation.status === 'validating' ? (
                <motion.div key="validating" className="flex min-h-[5.5rem] items-center gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.045] p-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <LoaderCircle className="size-5 shrink-0 animate-spin text-white/72" />
                  <div>
                    <p className="text-sm font-semibold text-white">Validating medical document</p>
                    <p className="mt-1 text-xs leading-5 text-white/46">Checking format, readability, document structure, and medical signals.</p>
                  </div>
                </motion.div>
              ) : validation.status === 'valid' ? (
                <motion.div key="valid" className="flex min-h-[5.5rem] items-center gap-3 rounded-[1.2rem] border border-emerald-200/20 bg-emerald-100/[0.07] p-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-100" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-50">Medical document verified</p>
                    <p className="mt-1 text-xs leading-5 text-emerald-50/58">
                      {documentLabels[validation.documentType] || 'Medical document'} · {Math.round(validation.confidence * 100)}% confidence
                    </p>
                  </div>
                </motion.div>
              ) : validation.status === 'borderline' ? (
                <motion.div key="borderline" className="min-h-[5.5rem] rounded-[1.2rem] border border-amber-200/24 bg-amber-100/[0.075] p-4" role="status" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-100" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-5 text-amber-50">{validation.message}</p>
                      <p className="mt-1 text-xs leading-5 text-amber-50/58">{validation.reason}</p>
                    </div>
                  </div>
                  {validation.medicalSignals.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5 pl-8">
                      {validation.medicalSignals.slice(0, 3).map((signal) => (
                        <span key={signal} className="rounded-full border border-amber-100/14 bg-black/18 px-2.5 py-1 text-[10px] font-medium text-amber-50/68">{signal}</span>
                      ))}
                    </div>
                  ) : null}
                  {validation.continued ? (
                    <div className="mt-3 flex items-center gap-2 pl-8 text-xs font-medium text-amber-50/72">
                      <CheckCircle2 className="size-4" /> Continue selected. Analysis is now available.
                    </div>
                  ) : (
                    <button className="glass-pill mt-3 min-h-11 px-4 text-xs font-semibold text-amber-50 sm:ml-8" type="button" onClick={continueAnyway}>
                      Continue Anyway
                    </button>
                  )}
                </motion.div>
              ) : validation.status === 'invalid' ? (
                <motion.div key="invalid" className="flex min-h-[5.5rem] items-start gap-3 rounded-[1.2rem] border border-red-200/22 bg-red-100/[0.075] p-4" role="alert" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-100" />
                  <div>
                    <p className="text-sm font-semibold leading-5 text-red-50">{validation.message}</p>
                    {validation.reason !== validation.message ? <p className="mt-1 text-xs leading-5 text-red-50/58">{validation.reason}</p> : null}
                  </div>
                </motion.div>
              ) : (
                <div key="idle" className="flex min-h-[5.5rem] items-center rounded-[1.2rem] border border-white/[0.07] bg-white/[0.025] px-4 text-xs leading-5 text-white/35">
                  Analysis stays locked until the selected image passes validation.
                </div>
              )}
            </AnimatePresence>
          </div>

          <button
            className="glass-pill-solid mt-1 flex h-14 items-center justify-center gap-3 px-6 text-center text-sm font-semibold tracking-[-0.02em] transition disabled:cursor-not-allowed disabled:opacity-40"
            type="button"
            disabled={!canAnalyze}
            onClick={analyze}
          >
            {loading || validation.status === 'validating' ? <LoaderCircle className="size-5 shrink-0 animate-spin" /> : <ScanLine className="size-5 shrink-0" />}
            {analyzeButtonLabel}
          </button>

          <AnimatePresence>
            {loading ? (
              <motion.div className="mt-4 rounded-[1.2rem] border border-white/10 bg-white/[0.045] p-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex items-start gap-3 text-xs text-white/58">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/50" />
                    <span className="relative inline-flex size-2 rounded-full bg-white" />
                  </span>
                  <span><strong className="font-semibold text-white/76">OCR first.</strong> Transcribing visible text, then rejecting any extracted field that is not present in that transcription.</span>
                </div>
              </motion.div>
            ) : null}
            {analysisError ? (
              <motion.div className="mt-4 flex items-start gap-3 rounded-[1.2rem] border border-red-200/22 bg-red-100/[0.075] p-4" role="alert" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-100" />
                <div>
                  <p className="text-sm font-semibold text-red-50">Analysis stopped safely</p>
                  <p className="mt-1 text-xs leading-5 text-red-50/60">{analysisError}</p>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </section>
      </div>

      <div className="mx-auto mt-5 max-w-6xl"><SafetyBanner compact /></div>

      <AnimatePresence>
        {cameraOpen ? (
          <motion.div
            className="fixed inset-0 z-[120] grid place-items-center overflow-y-auto bg-black/78 p-4 backdrop-blur-md sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="camera-dialog-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div className="modal-glass w-full max-w-2xl rounded-[2rem] p-4 sm:p-6" initial={{ opacity: 0, y: 16, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.99 }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/42">Camera Capture</p>
                  <h2 id="camera-dialog-title" className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">Photograph the medical document</h2>
                  <p className="mt-2 text-sm leading-6 text-white/46">Keep the full page inside the frame, use even light, and hold steady.</p>
                </div>
                <button className="glass-pill grid min-h-11 min-w-11 place-items-center text-white/68" type="button" aria-label="Close camera" onClick={closeCamera}>
                  <X className="size-4" />
                </button>
              </div>

              <div className="relative mt-5 aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-white/14 bg-black">
                <video ref={videoRef} className={`h-full w-full object-cover ${cameraStatus === 'ready' ? 'opacity-100' : 'opacity-0'}`} autoPlay muted playsInline />
                {cameraStatus === 'starting' ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <LoaderCircle className="size-7 animate-spin text-white/72" />
                    <p className="mt-3 text-sm text-white/52">Starting camera…</p>
                  </div>
                ) : null}
                {cameraStatus === 'error' ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                    <VideoOff className="size-8 text-white/42" />
                    <p className="mt-4 max-w-md text-sm leading-6 text-white/62">{cameraError}</p>
                  </div>
                ) : null}
                <div className="pointer-events-none absolute inset-4 rounded-[1.15rem] border border-white/25 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.32)]" />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button className="glass-pill min-h-12 px-5 text-sm font-semibold text-white/68" type="button" onClick={closeCamera}>Cancel</button>
                {cameraStatus === 'error' ? (
                  <button
                    className="glass-pill-solid flex min-h-12 items-center justify-center gap-2 px-5 text-sm font-semibold"
                    type="button"
                    onClick={() => {
                      closeCamera();
                      window.setTimeout(() => uploadInputRef.current?.click(), 0);
                    }}
                  >
                    <Upload className="size-4" /> Upload Image
                  </button>
                ) : (
                  <button className="glass-pill-solid flex min-h-12 items-center justify-center gap-2 px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40" type="button" disabled={cameraStatus !== 'ready'} onClick={capturePhoto}>
                    <Camera className="size-4" /> Capture Photo
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default AnalyzePage;
