# OCR Integration - Hybrid Approach

Camera-based OCR scanning for automatic data extraction from odometers, fuel pump displays, and receipts using a hybrid online/offline approach.

## Overview

Implement intelligent OCR scanning that automatically switches between AWS Textract (online, high accuracy) and Tesseract.js (offline, fallback) based on network connectivity and user preferences.

## Hybrid Architecture

### Smart OCR Engine
```typescript
interface OCRResult {
  type: 'odometer' | 'pump' | 'receipt';
  confidence: number;
  extractedData: {
    odometer?: number;
    volume?: number;
    pricePerUnit?: number;
    totalCost?: number;
    date?: string;
    stationName?: string;
  };
}

class HybridOCR {
  async extractText(imageFile: File, scanType: string): Promise<OCRResult> {
    if (navigator.onLine && this.shouldUseCloud()) {
      try {
        return await this.cloudOCR(imageFile, scanType);
      } catch (error) {
        console.log('Cloud OCR failed, falling back to offline');
        return await this.offlineOCR(imageFile, scanType);
      }
    } else {
      return await this.offlineOCR(imageFile, scanType);
    }
  }

  private shouldUseCloud(): boolean {
    // Use cloud OCR for better accuracy when available
    return navigator.onLine && !this.isLowDataMode();
  }
}
```

## Online OCR - AWS Textract

### Backend Lambda Function
```typescript
import { TextractClient, AnalyzeDocumentCommand } from '@aws-sdk/client-textract';

export const processOCR = async (event) => {
  const { image, scanType } = JSON.parse(event.body);
  
  const textract = new TextractClient({ region: 'us-east-1' });
  
  const command = new AnalyzeDocumentCommand({
    Document: { 
      Bytes: Buffer.from(image.replace(/^data:image\/\w+;base64,/, ''), 'base64')
    },
    FeatureTypes: ['TABLES', 'FORMS']
  });
  
  const result = await textract.send(command);
  const extractedData = parseTextractResult(result, scanType);
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      confidence: extractedData.confidence,
      data: extractedData.values,
      source: 'textract'
    })
  };
};

const parseTextractResult = (result, scanType) => {
  const text = result.Blocks
    .filter(block => block.BlockType === 'LINE')
    .map(block => block.Text)
    .join(' ');
    
  switch (scanType) {
    case 'odometer':
      return parseOdometer(text);
    case 'pump':
      return parsePumpDisplay(text);
    case 'receipt':
      return parseReceipt(text);
    default:
      return { confidence: 0, values: {} };
  }
};
```

### Frontend Cloud OCR
```typescript
const cloudOCR = async (imageFile: File, scanType: string): Promise<OCRResult> => {
  const base64 = await fileToBase64(imageFile);
  
  const response = await fetch('/api/ocr/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64, scanType })
  });
  
  const result = await response.json();
  
  return {
    type: scanType as any,
    confidence: result.confidence,
    extractedData: result.data
  };
};
```

## Offline OCR - Tesseract.js

### Optimized Tesseract Implementation
```typescript
import Tesseract from 'tesseract.js';

class OfflineOCR {
  private worker: Tesseract.Worker | null = null;
  
  async initialize() {
    if (!this.worker) {
      this.worker = await Tesseract.createWorker('eng', 1, {
        tessedit_char_whitelist: '0123456789.',
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE
      });
    }
  }
  
  async extractNumbers(imageFile: File): Promise<OCRResult> {
    await this.initialize();
    
    const { data: { text, confidence } } = await this.worker!.recognize(imageFile);
    const numbers = text.match(/\d+\.?\d*/g) || [];
    
    return {
      type: 'odometer',
      confidence: confidence / 100,
      extractedData: this.parseNumbers(numbers)
    };
  }
  
  private parseNumbers(numbers: string[]) {
    const integers = numbers.filter(n => !n.includes('.'));
    const decimals = numbers.filter(n => n.includes('.'));
    
    return {
      odometer: this.findOdometer(integers),
      volume: this.findVolume(decimals),
      totalCost: this.findPrice(decimals)
    };
  }
  
  private findOdometer(numbers: string[]): number | null {
    // Find 5-6 digit numbers (typical odometer range)
    const candidates = numbers.filter(n => n.length >= 5 && n.length <= 6);
    return candidates.length > 0 ? parseInt(candidates[0]) : null;
  }
  
  private findVolume(decimals: string[]): number | null {
    // Volume typically < 100 liters/gallons
    const candidate = decimals.find(n => parseFloat(n) < 100 && parseFloat(n) > 0);
    return candidate ? parseFloat(candidate) : null;
  }
  
  private findPrice(decimals: string[]): number | null {
    // Price typically > 1 and has 2 decimal places
    const candidate = decimals.find(n => 
      parseFloat(n) > 1 && n.split('.')[1]?.length === 2
    );
    return candidate ? parseFloat(candidate) : null;
  }
  
  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
```

## Smart Camera Scanner Component

```typescript
const SmartScanner = ({ onResult, scanType }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrEngine] = useState(new HybridOCR());
  
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { 
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });
    videoRef.current!.srcObject = stream;
  };
  
  const captureAndProcess = async () => {
    setIsProcessing(true);
    
    // Capture high-quality image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const video = videoRef.current!;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    // Convert to blob
    canvas.toBlob(async (blob) => {
      if (blob) {
        const result = await ocrEngine.extractText(blob, scanType);
        onResult(result);
      }
      setIsProcessing(false);
    }, 'image/jpeg', 0.9);
  };
  
  useEffect(() => {
    startCamera();
    return () => {
      // Cleanup camera stream
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);
  
  return (
    <div className="scanner-container">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="scanner-video"
      />
      
      <div className="scanner-overlay">
        <div className="scan-frame" />
        <p className="scan-instruction">
          Position {scanType} within the frame
        </p>
      </div>
      
      <button 
        onClick={captureAndProcess}
        disabled={isProcessing}
        className="capture-button"
      >
        {isProcessing ? 'Processing...' : '📷 Capture'}
      </button>
      
      <div className="scanner-status">
        {navigator.onLine ? '🌐 High Accuracy Mode' : '📱 Offline Mode'}
      </div>
    </div>
  );
};
```

## Parsing Logic

### Odometer Parser
```typescript
const parseOdometer = (text: string) => {
  const odometerRegex = /\b(\d{5,6})\b/g;
  const matches = text.match(odometerRegex);
  
  if (matches) {
    const value = parseInt(matches[0]);
    return {
      confidence: 0.9,
      values: { odometer: value }
    };
  }
  
  return { confidence: 0, values: {} };
};
```

### Fuel Pump Parser
```typescript
const parsePumpDisplay = (text: string) => {
  const patterns = {
    volume: /(\d+\.?\d*)\s*(gal|l|liter|галон|літр)/i,
    pricePerUnit: /(\d+\.?\d{2,3})\s*(\/gal|\/l|за літр)/i,
    totalCost: /total:?\s*\$?(\d+\.?\d{2})/i
  };
  
  return {
    confidence: 0.85,
    values: {
      volume: extractPattern(text, patterns.volume),
      pricePerUnit: extractPattern(text, patterns.pricePerUnit),
      totalCost: extractPattern(text, patterns.totalCost)
    }
  };
};
```

### Receipt Parser
```typescript
const parseReceipt = (text: string) => {
  const patterns = {
    date: /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
    time: /(\d{1,2}:\d{2})/,
    volume: /(\d+\.?\d*)\s*(gal|l)/i,
    total: /total:?\s*\$?(\d+\.?\d{2})/i,
    station: /^([A-Z\s&]+)$/m
  };
  
  return {
    confidence: 0.8,
    values: {
      date: extractPattern(text, patterns.date),
      time: extractPattern(text, patterns.time),
      volume: extractPattern(text, patterns.volume),
      totalCost: extractPattern(text, patterns.total),
      stationName: extractPattern(text, patterns.station)
    }
  };
};
```

## Integration with Refill Form

```typescript
const EnhancedRefillForm = () => {
  const [formData, setFormData] = useState({});
  const [showScanner, setShowScanner] = useState(false);
  const [scanType, setScanType] = useState<string | null>(null);
  
  const handleScanResult = (result: OCRResult) => {
    if (result.confidence > 0.7) {
      setFormData(prev => ({
        ...prev,
        ...result.extractedData,
        timestamp: new Date().toISOString()
      }));
      
      // Show success feedback
      toast.success(`${scanType} scanned successfully!`);
    } else {
      toast.warning('Low confidence scan. Please verify values.');
    }
    
    setShowScanner(false);
    setScanType(null);
  };
  
  const startScan = (type: string) => {
    setScanType(type);
    setShowScanner(true);
  };
  
  return (
    <div className="refill-form">
      <div className="scan-buttons">
        <button onClick={() => startScan('odometer')}>
          📷 Scan Odometer
        </button>
        <button onClick={() => startScan('pump')}>
          📷 Scan Pump
        </button>
        <button onClick={() => startScan('receipt')}>
          📷 Scan Receipt
        </button>
      </div>
      
      {showScanner && scanType && (
        <SmartScanner 
          onResult={handleScanResult}
          scanType={scanType}
        />
      )}
      
      {/* Regular form fields with pre-filled values */}
      <input 
        type="number" 
        value={formData.odometer || ''} 
        onChange={e => setFormData(prev => ({...prev, odometer: e.target.value}))}
        placeholder="Odometer reading"
      />
      {/* ... other form fields */}
    </div>
  );
};
```

## Performance & Cost Analysis

### AWS Textract Costs
- **Document Analysis**: $1.50 per 1,000 pages
- **Monthly estimate**: 500 users × 8 scans = 4,000 scans = $6/month

### Bundle Size Impact
- **Tesseract.js**: ~2MB (lazy loaded)
- **Total impact**: Minimal with code splitting

### Accuracy Comparison
| Scenario | Online (Textract) | Offline (Tesseract) |
|----------|-------------------|---------------------|
| Clear odometer | 95-99% | 80-85% |
| Pump display | 90-95% | 75-80% |
| Receipt text | 95-99% | 70-75% |
| Poor lighting | 85-90% | 60-70% |

## Implementation Timeline

### Phase 1: Basic Hybrid (2 weeks)
- AWS Textract integration
- Tesseract.js fallback
- Simple number extraction

### Phase 2: Smart Parsing (2 weeks)
- Advanced text parsing
- Context-aware extraction
- Confidence scoring

### Phase 3: UX Polish (1 week)
- Camera guides and overlays
- Real-time feedback
- Error handling

## Benefits

### User Experience
- **10x faster** data entry than manual typing
- **Works everywhere** - online and offline
- **High accuracy** when connected
- **Always functional** when offline

### Business Value
- **Reduced friction** increases user adoption
- **Premium feature** differentiates from competitors
- **Data quality** improves with automated extraction
- **User retention** through innovative UX

## Technical Requirements

### Frontend Dependencies
```json
{
  "tesseract.js": "^4.1.1",
  "@types/tesseract.js": "^4.0.0"
}
```

### Backend Dependencies
```json
{
  "@aws-sdk/client-textract": "^3.0.0"
}
```

### API Endpoints
- `POST /api/ocr/extract` - Process image with Textract
- `GET /api/ocr/status` - Check OCR service availability

## Conclusion

The hybrid OCR approach provides the best of both worlds: high accuracy when online with AWS Textract, and reliable fallback with Tesseract.js when offline. This ensures FuelSync works perfectly in all conditions while providing a premium scanning experience that dramatically reduces manual data entry.