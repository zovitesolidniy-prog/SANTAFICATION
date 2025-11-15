import { useState, useRef } from "react";
import "@/App.css";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
        setSelectedImage(reader.result);
        setResult(null); // Clear previous result
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
        setSelectedImage(reader.result);
        setResult(null);
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Please drop an image file");
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const pixelifyImage = async () => {
    if (!selectedImage) {
      toast.error("Please select an image first");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/pixelify`, {
        image_base64: selectedImage
      });

      setResult(response.data);
      toast.success("Image pixelified successfully!");
    } catch (error) {
      console.error("Error pixelifying image:", error);
      toast.error(error.response?.data?.detail || "Failed to process image");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="App">
      <div className="pixel-container">
        {/* Header */}
        <header className="header" data-testid="app-header">
          <div className="logo-container">
            <img 
              src="https://customer-assets.emergentagent.com/job_pixel-pokemon-1/artifacts/9lf9mvbs_character.png" 
              alt="Pokemon Logo" 
              className="logo-image"
              data-testid="logo-image"
            />
          </div>
          <div className="title" data-testid="app-title">
            <span className="title-text">POKÉMON</span>
            <span className="title-sub">PIXELIZER</span>
          </div>
          <div className="logo-container">
            <img 
              src="https://customer-assets.emergentagent.com/job_pixel-pokemon-1/artifacts/9lf9mvbs_character.png" 
              alt="Pokemon Logo" 
              className="logo-image"
            />
          </div>
        </header>

        {/* Main Content */}
        <div className="content-wrapper">
          {!result ? (
            <Card className="upload-card" data-testid="upload-section">
              <CardContent className="card-content">
                {/* Upload Area */}
                <div
                  className="upload-area"
                  data-testid="upload-area"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    data-testid="file-input"
                  />
                  
                  {previewUrl ? (
                    <div className="preview-container" data-testid="image-preview">
                      <img src={previewUrl} alt="Preview" className="preview-image" />
                      <div className="preview-overlay">
                        <p className="preview-text">Click to change image</p>
                      </div>
                    </div>
                  ) : (
                    <div className="upload-prompt">
                      <div className="upload-icon-wrapper">
                        <Upload className="upload-icon" size={48} />
                      </div>
                      <h3 className="upload-title">Drop your image here</h3>
                      <p className="upload-subtitle">or click to browse</p>
                      <p className="upload-hint">Supports JPG, PNG, WEBP</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {selectedImage && (
                  <div className="button-group">
                    <Button
                      onClick={pixelifyImage}
                      disabled={loading}
                      className="pixelify-button"
                      data-testid="pixelify-button"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="button-icon spinning" size={20} />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="button-icon" size={20} />
                          PIXELIFY!
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={resetForm}
                      variant="outline"
                      className="reset-button"
                      data-testid="reset-button"
                    >
                      Reset
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="result-card" data-testid="result-section">
              <CardContent className="result-content">
                <div className="result-header">
                  <Sparkles className="result-icon" size={32} />
                  <h2 className="result-title" data-testid="result-title">PIXELIFIED!</h2>
                </div>
                
                <div className="result-grid">
                  {/* Original Image */}
                  <div className="result-image-container">
                    <h3 className="result-label">ORIGINAL</h3>
                    <div className="result-image-wrapper">
                      <img src={previewUrl} alt="Original" className="result-image" />
                    </div>
                  </div>
                  
                  {/* Pixelified Description */}
                  <div className="result-description-container">
                    <h3 className="result-label">POKÉMON VISION</h3>
                    <div className="result-description" data-testid="result-text">
                      <p>{result.result_text}</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={resetForm}
                  className="new-image-button"
                  data-testid="new-image-button"
                  size="lg"
                >
                  <Upload className="button-icon" size={20} />
                  PIXELIFY ANOTHER
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Decorative Elements */}
        <div className="pixel-decorations">
          <div className="pixel-star pixel-star-1"></div>
          <div className="pixel-star pixel-star-2"></div>
          <div className="pixel-star pixel-star-3"></div>
          <div className="pixel-star pixel-star-4"></div>
        </div>
      </div>
    </div>
  );
}

export default App;