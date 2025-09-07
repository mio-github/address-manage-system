import { spawn } from 'child_process';
import path from 'path';
import { AnalysisResult } from '@shared/types';

export class ImageAnalysisService {
  private pythonServiceUrl: string = 'http://localhost:5000';
  private pythonProcess: any = null;

  async startPythonService(): Promise<void> {
    const pythonScriptPath = path.join(__dirname, '../../../python-service/main.py');
    
    this.pythonProcess = spawn('python', [pythonScriptPath]);
    
    this.pythonProcess.stdout.on('data', (data: Buffer) => {
      console.log(`Python service: ${data.toString()}`);
    });
    
    this.pythonProcess.stderr.on('data', (data: Buffer) => {
      console.error(`Python service error: ${data.toString()}`);
    });

    // Wait for service to start
    await this.waitForService();
  }

  private async waitForService(maxAttempts: number = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`${this.pythonServiceUrl}/health`);
        if (response.ok) {
          console.log('Python service is ready');
          return;
        }
      } catch (error) {
        // Service not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Python service failed to start');
  }

  async analyzeScreenshot(imagePath: string): Promise<AnalysisResult> {
    try {
      const response = await fetch(`${this.pythonServiceUrl}/analyze/screenshot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image_path: imagePath,
          options: {
            detect_coordinates: true,
            detect_location: true,
            detect_structures: true,
            detect_biome: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        coordinates: result.coordinates,
        location: result.location,
        rawOcrText: result.raw_ocr_text
      };
    } catch (error) {
      console.error('Failed to analyze screenshot:', error);
      throw error;
    }
  }

  async updateAnalysis(screenshotId: number, corrections: any): Promise<void> {
    try {
      const response = await fetch(`${this.pythonServiceUrl}/analyze/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          screenshot_id: screenshotId,
          corrections
        })
      });

      if (!response.ok) {
        throw new Error(`Update failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to update analysis:', error);
      throw error;
    }
  }

  async stopPythonService(): Promise<void> {
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = null;
    }
  }
}