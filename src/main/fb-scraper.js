const { BrowserWindow } = require('electron');
const fbEngine = require('../fb_ingestion_engine');

class FBScraperWindow {
  constructor() {
    this.scraperWindow = null;
  }

  async scrapeUrl(url) {
    return new Promise((resolve, reject) => {
      console.log(`[FB SCRAPER] Instantiating hidden browser window for ${url}`);
      
      this.scraperWindow = new BrowserWindow({
        show: false, // Keep it invisible
        width: 1280,
        height: 800,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: true // Keep it realistic
        }
      });

      // Spoof User Agent
      this.scraperWindow.webContents.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36');

      this.scraperWindow.loadURL(url);

      this.scraperWindow.webContents.on('did-finish-load', async () => {
        console.log(`[FB SCRAPER] Page loaded. Injecting extraction payload...`);
        
        try {
          // Wait a few seconds for React to finish rendering images
          await new Promise(r => setTimeout(r, 4000));

          // Inject DOM extraction script
          const extractionScript = `
            (() => {
              try {
                // Try to find the title/price using common Facebook Marketplace classes or meta tags
                const titleMeta = document.querySelector('meta[property="og:title"]');
                const title = titleMeta ? titleMeta.content : document.title;
                
                const descMeta = document.querySelector('meta[property="og:description"]');
                const description = descMeta ? descMeta.content : '';
                
                // Try to find the main carousel images
                const images = Array.from(document.querySelectorAll('img'))
                  .map(img => img.src)
                  .filter(src => src.includes('scontent') || src.includes('fbcdn'))
                  .filter(src => src.length > 50); // Avoid small icons

                // Deduplicate images
                const uniqueImages = [...new Set(images)];

                return {
                  title: title,
                  description: description,
                  images: uniqueImages,
                  url: window.location.href,
                  success: true
                };
              } catch (e) {
                return { success: false, error: e.message };
              }
            })();
          `;

          const result = await this.scraperWindow.webContents.executeJavaScript(extractionScript);
          
          if (result && result.success) {
            console.log(`[FB SCRAPER] Extraction complete:`, result.title);
            
            // Format into our rawPost structure
            const rawPost = {
              source_type: 'Facebook Marketplace',
              group_name: 'Direct Extension Ingestion',
              seller_name: 'Verified Seller', // Can be parsed further
              post_text: `${result.title} - ${result.description}`,
              media_urls: result.images.slice(0, 8), // Take top 8 images
              post_url: result.url
            };

            // Close the hidden window
            this.scraperWindow.close();
            this.scraperWindow = null;

            resolve(rawPost);
          } else {
            this.scraperWindow.close();
            reject(new Error('Extraction script failed or returned no data'));
          }
        } catch (error) {
          console.error('[FB SCRAPER] Error during extraction:', error);
          if (this.scraperWindow) this.scraperWindow.close();
          reject(error);
        }
      });

      // Handle load failures
      this.scraperWindow.webContents.on('did-fail-load', (e, code, desc) => {
        console.error('[FB SCRAPER] Failed to load URL:', desc);
        this.scraperWindow.close();
        reject(new Error(`Failed to load ${url}: ${desc}`));
      });
    });
  }
}

module.exports = new FBScraperWindow();
