import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Plane, Globe } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export default function AircraftData() {
  const [tailNumber, setTailNumber] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [aircraftData, setAircraftData] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 }); // Center by default
  const [imageZoom, setImageZoom] = useState(100); // 100% zoom by default
  const [selectedAmenities, setSelectedAmenities] = useState<Record<string, boolean>>({});
  const [customAmenities, setCustomAmenities] = useState<string[]>(['', '', '']);
  const { toast } = useToast();

  const handleFetch = async () => {
    if (!tailNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tail number",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setAircraftData(null);

    try {
      const { data, error } = await supabase.functions.invoke('get-aviapages-aircraft', {
        body: {
          tailNumber: tailNumber.trim(),
          webhookUrl: webhookUrl.trim() || undefined
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch aircraft data');
      }

      // Extract the first aircraft from the results array
      const aircraft = data.data?.results?.[0] || null;
      
      if (!aircraft) {
        throw new Error('No aircraft found with that tail number');
      }

      setAircraftData(aircraft);
      
      // Initialize amenities selection
      const initialAmenities: Record<string, boolean> = {};
      if (aircraft.aircraft_extension?.wireless_internet) initialAmenities.wifi = true;
      if (aircraft.aircraft_extension?.entertainment_system) initialAmenities.entertainment = true;
      if (aircraft.aircraft_extension?.shower) initialAmenities.shower = true;
      if (aircraft.aircraft_extension?.pets_allowed) initialAmenities.pets = true;
      if (aircraft.aircraft_extension?.divan_seats) initialAmenities.divan = true;
      setSelectedAmenities(initialAmenities);
      
      toast({
        title: "Success",
        description: webhookUrl.trim() 
          ? "Aircraft data fetched and sent to webhook"
          : "Aircraft data fetched successfully"
      });
    } catch (error) {
      console.error('Error fetching aircraft data:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch aircraft data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJson = () => {
    if (aircraftData) {
      navigator.clipboard.writeText(JSON.stringify(aircraftData, null, 2));
      toast({
        title: "Copied",
        description: "JSON data copied to clipboard"
      });
    }
  };

  const handleCopyEmailHTML = async () => {
    const aircraft = aircraftData;
    if (!aircraft) return;

    toast({
      title: "Uploading Images",
      description: "Preparing email..."
    });

    try {
      // Get up to 3 cabin images
      const cabinImages = aircraft.aircraft_images?.filter(
        (img: any) => img.image_type?.name?.toLowerCase().includes('cabin')
      ).slice(0, 3) || [];

      // Upload images to Supabase Storage and get public URLs
      const hostedImageUrls: string[] = [];
      
      for (let i = 0; i < cabinImages.length; i++) {
        const img = cabinImages[i];
        try {
          // Fetch the image
          const response = await fetch(img.image_url);
          const blob = await response.blob();
          
          // Generate a unique filename
          const filename = `aircraft-email-${aircraft.registration_number || Date.now()}-${i}.jpg`;
          const filePath = `email-images/${filename}`;
          
          // Upload to Supabase Storage
          const { data, error } = await supabase.storage
            .from('email-assets')
            .upload(filePath, blob, {
              contentType: 'image/jpeg',
              upsert: true
            });
          
          if (error) throw error;
          
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('email-assets')
            .getPublicUrl(filePath);
          
          hostedImageUrls.push(publicUrl);
        } catch (error) {
          console.error('Failed to upload image:', error);
        }
      }

      // Generate compact email HTML with hosted images
      const emailHTML = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-bottom: 1px solid #e5e7eb;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827; letter-spacing: 1px;">${aircraft.aircraft_type?.name || 'Luxury Aircraft'}</h1>
    ${aircraft.aircraft_type?.aircraft_class?.name ? `<p style="margin: 8px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280;">${aircraft.aircraft_type.aircraft_class.name} Jet</p>` : ''}
  </div>
  
  <div style="padding: 24px;">
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        ${aircraft.passengers_max ? `
        <td style="text-align: center; padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
          <div style="font-size: 28px; font-weight: 300; color: #111827; margin-bottom: 4px;">${aircraft.passengers_max}</div>
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280;">Passengers</div>
        </td>` : ''}
        ${aircraft.aircraft_extension?.sleeping_places ? `
        <td style="text-align: center; padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
          <div style="font-size: 28px; font-weight: 300; color: #111827; margin-bottom: 4px;">${aircraft.aircraft_extension.sleeping_places}</div>
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280;">Sleeping</div>
        </td>` : ''}
        ${aircraft.year_of_production ? `
        <td style="text-align: center; padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
          <div style="font-size: 28px; font-weight: 300; color: #111827; margin-bottom: 4px;">${aircraft.year_of_production}</div>
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280;">Year Built</div>
        </td>` : ''}
      </tr>
    </table>
    
    ${hostedImageUrls.length > 0 ? `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        ${hostedImageUrls.map((url: string) => `
        <td style="padding: 4px;">
          <img src="${url}" alt="Interior" style="width: 100%; height: auto; border-radius: 6px; display: block;">
        </td>
        `).join('')}
      </tr>
    </table>` : ''}
    
    ${(Object.values(selectedAmenities).some(v => v) || customAmenities.some(a => a.trim())) ? `
    <div style="margin-bottom: 20px;">
      <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin: 0 0 12px 0;">Premium Amenities</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          ${selectedAmenities.wifi ? '<td style="padding: 8px 0;"><span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #3b82f6; margin-right: 8px;"></span><span style="font-size: 13px; color: #111827;">WiFi</span></td>' : ''}
          ${selectedAmenities.entertainment ? '<td style="padding: 8px 0;"><span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #3b82f6; margin-right: 8px;"></span><span style="font-size: 13px; color: #111827;">Entertainment</span></td>' : ''}
          ${selectedAmenities.shower ? '<td style="padding: 8px 0;"><span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #3b82f6; margin-right: 8px;"></span><span style="font-size: 13px; color: #111827;">Shower</span></td>' : ''}
        </tr>
        ${selectedAmenities.pets || selectedAmenities.divan || customAmenities.some(a => a.trim()) ? `<tr>
          ${selectedAmenities.pets ? '<td style="padding: 8px 0;"><span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #3b82f6; margin-right: 8px;"></span><span style="font-size: 13px; color: #111827;">Pet Friendly</span></td>' : ''}
          ${selectedAmenities.divan ? '<td style="padding: 8px 0;"><span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #3b82f6; margin-right: 8px;"></span><span style="font-size: 13px; color: #111827;">Divan Seats</span></td>' : ''}
          ${customAmenities.filter(a => a.trim()).slice(0, 1).map(a => `<td style="padding: 8px 0;"><span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #3b82f6; margin-right: 8px;"></span><span style="font-size: 13px; color: #111827;">${a}</span></td>`).join('')}
        </tr>` : ''}
      </table>
    </div>` : ''}
    
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280;">STRATOS JET CHARTERS</p>
    </div>
  </div>
</div>`;

      // Copy to clipboard
      const type = "text/html";
      const blob = new Blob([emailHTML], { type });
      const data = [new ClipboardItem({ [type]: blob })];
      await navigator.clipboard.write(data);
      
      toast({
        title: "Copied!",
        description: "Images hosted - paste into Gmail now"
      });
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: "Error",
        description: "Failed to prepare email",
        variant: "destructive"
      });
    }
  };

  const compressImage = async (url: string, maxWidth: number = 800, quality: number = 0.6): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(blob);
      });
    } catch (error) {
      console.error('Failed to compress image:', error);
      return url; // Fallback to original URL
    }
  };

  const handleExportPDF = async () => {
    // Generate the optimized HTML and print it
    const aircraft = aircraftData;
    
    toast({
      title: "Processing Images",
      description: "Compressing images for export..."
    });
    
    // Fetch and convert logo to base64
    let logoBase64 = '';
    try {
      const logoResponse = await fetch('/images/stratos_logo.png');
      const logoBlob = await logoResponse.blob();
      logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });
    } catch (error) {
      console.error('Failed to load logo:', error);
    }
    
    // Compress hero image
    const heroImage = aircraft.images?.[0] ? await compressImage(aircraft.images[0].media.path, 1200, 0.65) : '';
    
    // Compress interior images
    const cabinImages = aircraft.images?.filter((img: any) => img.tag?.value === 'cabin') || [];
    const compressedCabinImages = await Promise.all(
      cabinImages.map((img: any) => compressImage(img.media.path, 600, 0.6))
    );
    
    // Compress layout image
    const layoutImage = aircraft.images?.find((img: any) => img.tag?.value === 'plan');
    const compressedLayoutImage = layoutImage ? await compressImage(layoutImage.media.path, 800, 0.65) : '';
    
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${aircraft?.aircraft_type?.name || 'Aircraft'} - Stratos Jets</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
      background: white; 
      padding: 0;
    }
    .container { 
      max-width: 100%; 
      margin: 0; 
      background: white; 
    }
    .header {
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .logo { 
      height: 50px;
    }
    .title-section {
      text-align: right;
    }
    .title-section h1 { 
      font-size: 28px; 
      font-weight: 600; 
      letter-spacing: 1.5px; 
      margin: 0;
      color: #111827;
    }
    .title-section p { 
      font-size: 11px; 
      text-transform: uppercase; 
      letter-spacing: 1.5px;
      color: #6b7280;
      margin: 4px 0 0 0;
    }
    .hero { 
      position: relative; 
      height: 320px;
      overflow: hidden;
      background: #f9fafb;
    }
    .hero-bg { 
      width: 100%; 
      height: 100%; 
      object-fit: cover;
      object-position: ${imagePosition.x}% ${imagePosition.y}%;
      transform: scale(${imageZoom / 100});
      transform-origin: ${imagePosition.x}% ${imagePosition.y}%;
    }
    .content { padding: 24px; }
    .stats { 
      display: grid; 
      grid-template-columns: repeat(4, 1fr); 
      gap: 8px; 
      margin-bottom: 16px;
    }
    .stat { 
      text-align: center; 
      padding: 12px; 
      background: #f9fafb; 
      border: 1px solid #e5e7eb; 
      border-radius: 8px;
    }
    .stat-value { font-size: 20px; font-weight: 300; margin-bottom: 4px; color: #111827; }
    .stat-label { 
      font-size: 9px; 
      text-transform: uppercase; 
      letter-spacing: 1px; 
      color: #6b7280; 
      font-weight: 500;
    }
    h2 { 
      font-size: 12px; 
      font-weight: 400; 
      letter-spacing: 0.5px; 
      margin: 12px 0 8px; 
      color: #6b7280;
      text-transform: uppercase;
    }
    .gallery { 
      display: grid; 
      grid-template-columns: repeat(${compressedCabinImages.length === 1 ? '1' : compressedCabinImages.length === 2 ? '2' : '3'}, 1fr); 
      gap: 8px; 
      margin-bottom: 16px;
    }
    .gallery img { 
      width: 100%; 
      aspect-ratio: 4/3;
      object-fit: cover; 
      border-radius: 8px;
    }
    .floorplan { 
      background: #f9fafb; 
      padding: 12px; 
      border-radius: 8px; 
      border: 1px solid #e5e7eb;
      margin-bottom: 16px;
    }
    .floorplan img { width: 100%; height: auto; border-radius: 6px; }
    .amenities { 
      display: grid; 
      grid-template-columns: repeat(3, 1fr); 
      gap: 6px;
    }
    .amenity { 
      display: flex; 
      align-items: center; 
      gap: 8px; 
      padding: 10px; 
      background: #f9fafb; 
      border: 1px solid #e5e7eb; 
      border-radius: 8px;
    }
    .amenity-dot { 
      width: 6px; 
      height: 6px; 
      border-radius: 50%; 
      background: #3b82f6;
      flex-shrink: 0;
    }
    .amenity-text { font-size: 11px; font-weight: 300; letter-spacing: 0.3px; }
    .footer { 
      text-align: center; 
      padding: 12px 0; 
      border-top: 1px solid #e5e7eb; 
      margin-top: 16px;
      color: #6b7280;
      font-size: 10px;
    }
    @media print {
      @page { size: letter; margin: 0.3in; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${logoBase64 ? `<img src="${logoBase64}" alt="Stratos Jets" class="logo">` : ''}
      <div class="title-section">
        <h1>${aircraft.aircraft_type?.name || 'Luxury Aircraft'}</h1>
        ${aircraft.aircraft_type?.aircraft_class?.name ? `<p>${aircraft.aircraft_type.aircraft_class.name} Jet</p>` : ''}
      </div>
    </div>
    ${heroImage ? `
    <div class="hero">
      <img src="${heroImage}" alt="Aircraft" class="hero-bg">
    </div>` : ''}
    
    <div class="content">
      <div class="stats">
        ${aircraft.passengers_max ? `
          <div class="stat">
            <div class="stat-value">${aircraft.passengers_max}</div>
            <div class="stat-label">Passengers</div>
          </div>` : ''}
        ${aircraft.aircraft_extension?.sleeping_places ? `
          <div class="stat">
            <div class="stat-value">${aircraft.aircraft_extension.sleeping_places}</div>
            <div class="stat-label">Sleeping Places</div>
          </div>` : ''}
        ${aircraft.year_of_production ? `
          <div class="stat">
            <div class="stat-value">${aircraft.year_of_production}</div>
            <div class="stat-label">Year Built</div>
          </div>` : ''}
        ${aircraft.aircraft_extension?.refurbishment ? `
          <div class="stat">
            <div class="stat-value">${aircraft.aircraft_extension.refurbishment}</div>
            <div class="stat-label">Refurbished</div>
          </div>` : ''}
      </div>
      
      ${compressedCabinImages.length > 0 ? `
        <h2>Interior Gallery</h2>
        <div class="gallery">
          ${compressedCabinImages.map((imgSrc: string) => 
            `<img src="${imgSrc}" alt="Interior">`
          ).join('')}
        </div>` : ''}
      
      ${compressedLayoutImage ? `
        <h2>Aircraft Layout</h2>
        <div style="margin-bottom: 8px; padding: 8px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px;">
          <p style="font-size: 9px; color: #6b7280; margin: 0;">
            <strong>Note:</strong> Layout is representative of aircraft type and may not reflect exact configuration.
          </p>
        </div>
        <div class="floorplan">
          <img src="${compressedLayoutImage}" alt="Floor Plan">
        </div>` : ''}
      
      ${(Object.values(selectedAmenities).some(v => v) || customAmenities.some(a => a.trim())) ? `
        <h2>Premium Amenities</h2>
        <div class="amenities">
          ${selectedAmenities.wifi ? '<div class="amenity"><div class="amenity-dot"></div><span class="amenity-text">Complimentary WiFi</span></div>' : ''}
          ${selectedAmenities.entertainment ? '<div class="amenity"><div class="amenity-dot"></div><span class="amenity-text">Entertainment System</span></div>' : ''}
          ${selectedAmenities.shower ? '<div class="amenity"><div class="amenity-dot"></div><span class="amenity-text">Private Shower</span></div>' : ''}
          ${selectedAmenities.pets ? '<div class="amenity"><div class="amenity-dot"></div><span class="amenity-text">Pet Friendly</span></div>' : ''}
          ${selectedAmenities.divan && aircraft.aircraft_extension?.divan_seats ? `<div class="amenity"><div class="amenity-dot"></div><span class="amenity-text">${aircraft.aircraft_extension.divan_seats} Divan Seats</span></div>` : ''}
          ${customAmenities.filter(a => a.trim()).map(a => `<div class="amenity"><div class="amenity-dot"></div><span class="amenity-text">${a}</span></div>`).join('')}
        </div>` : ''}
      
      
      <div class="footer">
        STRATOS JET CHARTERS
      </div>
    </div>
  </div>
</body>
</html>`;

    // Open in new window and print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(fullHtml);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    
    toast({
      title: "Opening Print Dialog",
      description: "Printing optimized PDF version"
    });
  };

  const handlePushToWeb = async () => {
    // Generate a standalone HTML version  
    const aircraft = aircraftData;
    
    toast({
      title: "Processing Images",
      description: "Compressing images for web export..."
    });
    
    // Fetch and convert logo to base64
    let logoBase64 = '';
    try {
      const logoResponse = await fetch('/images/stratos_logo.png');
      const logoBlob = await logoResponse.blob();
      logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });
    } catch (error) {
      console.error('Failed to load logo:', error);
    }
    
    // Compress hero image
    const heroImage = aircraft.images?.[0] ? await compressImage(aircraft.images[0].media.path, 1400, 0.7) : '';
    
    // Compress interior images
    const cabinImages = aircraft.images?.filter((img: any) => img.tag?.value === 'cabin') || [];
    const compressedCabinImages = await Promise.all(
      cabinImages.map((img: any) => compressImage(img.media.path, 800, 0.65))
    );
    
    // Compress layout image
    const layoutImage = aircraft.images?.find((img: any) => img.tag?.value === 'plan');
    const compressedLayoutImage = layoutImage ? await compressImage(layoutImage.media.path, 1000, 0.7) : '';
    
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${aircraft?.aircraft_type?.name || 'Aircraft'} - Stratos Jets</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
      background: #f9fafb; 
      padding: 20px;
    }
    .container { 
      max-width: 1200px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 16px; 
      overflow: hidden; 
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    }
    .header {
      padding: 30px 40px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: white;
    }
    .logo { 
      height: 60px;
    }
    .title-section {
      text-align: right;
    }
    .title-section h1 { 
      font-size: 36px; 
      font-weight: 600; 
      letter-spacing: 2px; 
      margin: 0;
      color: #111827;
    }
    .title-section p { 
      font-size: 14px; 
      text-transform: uppercase; 
      letter-spacing: 1.5px;
      color: #6b7280;
      margin: 6px 0 0 0;
    }
    .hero { 
      position: relative; 
      height: 400px;
      overflow: hidden;
      background: #f9fafb;
    }
    .hero-bg { 
      width: 100%; 
      height: 100%; 
      object-fit: cover;
      object-position: ${imagePosition.x}% ${imagePosition.y}%;
      transform: scale(${imageZoom / 100});
      transform-origin: ${imagePosition.x}% ${imagePosition.y}%;
    }
    .content { padding: 48px; }
    .stats { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
      gap: 24px; 
      margin-bottom: 48px;
    }
    .stat { 
      text-align: center; 
      padding: 24px; 
      background: #f9fafb; 
      border: 1px solid #e5e7eb; 
      border-radius: 12px;
    }
    .stat-value { font-size: 36px; font-weight: 300; margin-bottom: 8px; color: #111827; }
    .stat-label { 
      font-size: 11px; 
      text-transform: uppercase; 
      letter-spacing: 1px; 
      color: #6b7280; 
      font-weight: 500;
    }
    h2 { 
      font-size: 32px; 
      font-weight: 300; 
      letter-spacing: 1px; 
      margin: 48px 0 24px; 
      color: #111827;
    }
    .gallery { 
      display: grid; 
      grid-template-columns: repeat(${compressedCabinImages.length === 1 ? '1' : compressedCabinImages.length === 2 ? '2' : '3'}, 1fr); 
      gap: 16px; 
      margin-bottom: 48px;
    }
    .gallery img { 
      width: 100%; 
      aspect-ratio: 4/3;
      object-fit: cover; 
      border-radius: 12px; 
      cursor: pointer;
      transition: transform 0.3s;
    }
    .gallery img:hover { transform: scale(1.05); }
    .floorplan { 
      background: #f9fafb; 
      padding: 32px; 
      border-radius: 12px; 
      border: 1px solid #e5e7eb;
      margin-bottom: 48px;
    }
    .floorplan img { width: 100%; height: auto; border-radius: 8px; }
    .amenities { 
      display: grid; 
      grid-template-columns: repeat(3, 1fr); 
      gap: 12px;
    }
    .amenity { 
      display: flex; 
      align-items: center; 
      gap: 12px; 
      padding: 16px; 
      background: #f9fafb; 
      border: 1px solid #e5e7eb; 
      border-radius: 12px;
    }
    .amenity-dot { 
      width: 8px; 
      height: 8px; 
      border-radius: 50%; 
      background: #3b82f6;
      flex-shrink: 0;
    }
    .amenity-text { font-size: 16px; font-weight: 300; letter-spacing: 0.5px; }
    .footer { 
      text-align: center; 
      padding: 32px 0; 
      border-top: 1px solid #e5e7eb; 
      margin-top: 48px;
      color: #6b7280;
      font-size: 13px;
    }
    @media print {
      @page { size: letter; margin: 0.15in; }
      body { padding: 0; background: white; }
      .container { max-width: 100%; width: 100%; margin: 0; border-radius: 0; box-shadow: none; }
      .header { padding: 24px 30px; }
      .logo { height: 40px; }
      .title-section h1 { font-size: 22px; }
      .title-section p { font-size: 10px; margin-top: 2px; }
      .hero { height: 260px; }
      .content { padding: 30px; }
      .stats { 
        grid-template-columns: repeat(4, 1fr); 
        gap: 12px; 
        margin-bottom: 20px; 
      }
      .stat { padding: 16px; }
      .stat-value { font-size: 24px; }
      .stat-label { font-size: 9px; }
      h2 { font-size: 18px; margin: 16px 0 12px; }
      .gallery { gap: 8px; margin-bottom: 16px; }
      .floorplan { padding: 12px; margin-bottom: 16px; }
      .amenities { gap: 6px; }
      .amenity { padding: 10px; font-size: 11px; }
      .amenity-text { font-size: 11px; }
      .amenity-dot { width: 6px; height: 6px; }
      .footer { padding: 12px 0; margin-top: 16px; font-size: 10px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${logoBase64 ? `<img src="${logoBase64}" alt="Stratos Jets" class="logo">` : ''}
      <div class="title-section">
        <h1>${aircraft.aircraft_type?.name || 'Luxury Aircraft'}</h1>
        ${aircraft.aircraft_type?.aircraft_class?.name ? `<p>${aircraft.aircraft_type.aircraft_class.name} Jet</p>` : ''}
      </div>
    </div>
    ${heroImage ? `
    <div class="hero">
      <img src="${heroImage}" alt="Aircraft" class="hero-bg">
    </div>` : ''}
    
    <div class="content">
      <div class="stats">
        ${aircraft.passengers_max ? `
          <div class="stat">
            <div class="stat-value">${aircraft.passengers_max}</div>
            <div class="stat-label">Passengers</div>
          </div>` : ''}
        ${aircraft.aircraft_extension?.sleeping_places ? `
          <div class="stat">
            <div class="stat-value">${aircraft.aircraft_extension.sleeping_places}</div>
            <div class="stat-label">Sleeping Places</div>
          </div>` : ''}
        ${aircraft.year_of_production ? `
          <div class="stat">
            <div class="stat-value">${aircraft.year_of_production}</div>
            <div class="stat-label">Year Built</div>
          </div>` : ''}
        ${aircraft.aircraft_extension?.refurbishment ? `
          <div class="stat">
            <div class="stat-value">${aircraft.aircraft_extension.refurbishment}</div>
            <div class="stat-label">Refurbished</div>
          </div>` : ''}
      </div>
      
      ${compressedCabinImages.length > 0 ? `
        <h2>Interior Gallery</h2>
        <div class="gallery">
          ${compressedCabinImages.map((imgSrc: string) => 
            `<img src="${imgSrc}" alt="Interior">`
          ).join('')}
        </div>` : ''}
      
      ${compressedLayoutImage ? `
        <h2>Aircraft Layout</h2>
        <div style="margin-bottom: 12px; padding: 10px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px;">
          <p style="font-size: 11px; color: #6b7280; margin: 0;">
            <strong>Note:</strong> Layout is representative of aircraft type and may not reflect exact configuration.
          </p>
        </div>
        <div class="floorplan">
          <img src="${compressedLayoutImage}" alt="Floor Plan">
        </div>` : ''}
      
      ${(Object.values(selectedAmenities).some(v => v) || customAmenities.some(a => a.trim())) ? `
        <h2>Premium Amenities</h2>
        <div class="amenities">
          ${selectedAmenities.wifi ? '<div class="amenity"><div class="amenity-dot"></div><span class="amenity-text">Complimentary WiFi</span></div>' : ''}
          ${selectedAmenities.entertainment ? '<div class="amenity"><div class="amenity-dot"></div><span class="amenity-text">Entertainment System</span></div>' : ''}
          ${selectedAmenities.shower ? '<div class="amenity"><div class="amenity-dot"></div><span class="amenity-text">Private Shower</span></div>' : ''}
          ${selectedAmenities.pets ? '<div class="amenity"><div class="amenity-dot"></div><span class="amenity-text">Pet Friendly</span></div>' : ''}
          ${selectedAmenities.divan && aircraft.aircraft_extension?.divan_seats ? `<div class="amenity"><div class="amenity-dot"></div><span class="amenity-text">${aircraft.aircraft_extension.divan_seats} Divan Seats</span></div>` : ''}
          ${customAmenities.filter(a => a.trim()).map(a => `<div class="amenity"><div class="amenity-dot"></div><span class="amenity-text">${a}</span></div>`).join('')}
        </div>` : ''}
      
      
      <div class="footer">
        STRATOS JET CHARTERS
      </div>
    </div>
  </div>
</body>
</html>`;
    
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${aircraft?.registration_number || 'aircraft'}-showcase.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Web Page Downloaded",
      description: "Upload this HTML file to workatrip.com to publish"
    });
  };

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #aircraft-display, #aircraft-display * {
            visibility: visible;
          }
          #aircraft-display {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            page-break-inside: avoid;
          }
          .no-print {
            display: none !important;
          }
          .hero {
            height: 180px !important;
          }
          .content {
            padding: 16px !important;
          }
          .stats {
            gap: 8px !important;
            margin-bottom: 16px !important;
          }
          .stat {
            padding: 12px !important;
          }
          .stat-value {
            font-size: 20px !important;
          }
          .stat-label {
            font-size: 9px !important;
          }
          h2 {
            font-size: 18px !important;
            margin: 16px 0 12px !important;
          }
          .gallery {
            gap: 6px !important;
            margin-bottom: 16px !important;
          }
          .gallery img {
            width: 100% !important;
            height: 110px !important;
            object-fit: cover !important;
          }
          .floorplan {
            padding: 12px !important;
            margin-bottom: 16px !important;
          }
          .amenities {
            gap: 6px !important;
          }
          .amenity {
            padding: 10px !important;
          }
          .amenity-text {
            font-size: 11px !important;
          }
          .footer {
            padding: 12px 0 !important;
            margin-top: 16px !important;
            font-size: 10px !important;
          }
        }
        @page {
          size: letter;
          margin: 0.3in;
        }
      `}</style>
      
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-7xl w-full p-0 bg-black/95">
          {selectedImage && (
            <img 
              src={selectedImage} 
              alt="Aircraft detail"
              className="w-full h-auto"
            />
          )}
        </DialogContent>
      </Dialog>
      
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-4xl mx-auto no-print">
          <CardHeader>
            <CardTitle>Aircraft Data Lookup</CardTitle>
            <CardDescription>
              Fetch aircraft data from Aviapages and optionally export to n8n webhook
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tailNumber">Tail Number</Label>
                <Input
                  id="tailNumber"
                  placeholder="e.g., N12345"
                  value={tailNumber}
                  onChange={(e) => setTailNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">n8n Webhook URL (Optional)</Label>
                <Input
                  id="webhookUrl"
                  placeholder="https://your-n8n-instance.com/webhook/..."
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleFetch} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  'Fetch Aircraft Data'
                )}
              </Button>
            </div>

            {aircraftData && (
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold">Aircraft Data</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyEmailHTML}>
                      Copy for Gmail
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePushToWeb}>
                      <Globe className="mr-2 h-4 w-4" />
                      Export Web Page
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportPDF}>
                      <Download className="mr-2 h-4 w-4" />
                      Export PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopyJson}>
                      Copy JSON
                    </Button>
                  </div>
                </div>

                {/* Amenities Selection */}
                <div className="space-y-3 pt-4">
                  <Label className="text-base font-semibold">Select Amenities to Display</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {aircraftData.aircraft_extension?.wireless_internet && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="wifi"
                          checked={selectedAmenities.wifi || false}
                          onCheckedChange={(checked) => 
                            setSelectedAmenities(prev => ({ ...prev, wifi: !!checked }))
                          }
                        />
                        <label htmlFor="wifi" className="text-sm cursor-pointer">Complimentary WiFi</label>
                      </div>
                    )}
                    {aircraftData.aircraft_extension?.entertainment_system && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="entertainment"
                          checked={selectedAmenities.entertainment || false}
                          onCheckedChange={(checked) => 
                            setSelectedAmenities(prev => ({ ...prev, entertainment: !!checked }))
                          }
                        />
                        <label htmlFor="entertainment" className="text-sm cursor-pointer">Entertainment System</label>
                      </div>
                    )}
                    {aircraftData.aircraft_extension?.shower && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="shower"
                          checked={selectedAmenities.shower || false}
                          onCheckedChange={(checked) => 
                            setSelectedAmenities(prev => ({ ...prev, shower: !!checked }))
                          }
                        />
                        <label htmlFor="shower" className="text-sm cursor-pointer">Private Shower</label>
                      </div>
                    )}
                    {aircraftData.aircraft_extension?.pets_allowed && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="pets"
                          checked={selectedAmenities.pets || false}
                          onCheckedChange={(checked) => 
                            setSelectedAmenities(prev => ({ ...prev, pets: !!checked }))
                          }
                        />
                        <label htmlFor="pets" className="text-sm cursor-pointer">Pet Friendly</label>
                      </div>
                    )}
                    {aircraftData.aircraft_extension?.divan_seats && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="divan"
                          checked={selectedAmenities.divan || false}
                          onCheckedChange={(checked) => 
                            setSelectedAmenities(prev => ({ ...prev, divan: !!checked }))
                          }
                        />
                        <label htmlFor="divan" className="text-sm cursor-pointer">{aircraftData.aircraft_extension.divan_seats} Divan Seats</label>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label className="text-sm">Custom Amenities</Label>
                    {customAmenities.map((amenity, index) => (
                      <Input
                        key={index}
                        placeholder={`Custom amenity ${index + 1}`}
                        value={amenity}
                        onChange={(e) => {
                          const newCustomAmenities = [...customAmenities];
                          newCustomAmenities[index] = e.target.value;
                          setCustomAmenities(newCustomAmenities);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {aircraftData && (
          <div id="aircraft-display" className="max-w-6xl mx-auto mt-8 bg-background rounded-2xl overflow-hidden shadow-2xl">
            {/* Header with Logo and Aircraft Name */}
            <div className="bg-background p-8 border-b">
              <div className="flex items-center justify-between">
                <img 
                  src="/images/stratos_logo.png" 
                  alt="Stratos Jets"
                  className="h-16 w-auto"
                />
                <div className="text-right">
                  <h1 className="text-4xl font-semibold tracking-wider text-foreground">{aircraftData.aircraft_type?.name || 'Luxury Aircraft'}</h1>
                  {aircraftData.aircraft_type?.aircraft_class?.name && (
                    <p className="text-sm font-light text-muted-foreground tracking-widest uppercase mt-1">{aircraftData.aircraft_type.aircraft_class.name} Jet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Hero Image with Position Controls */}
            {aircraftData.images?.[0] && (
              <div className="relative">
                <div className="no-print absolute top-4 right-4 z-10 flex flex-col gap-2 bg-background/90 p-3 rounded-lg shadow-lg">
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setImagePosition(prev => ({ ...prev, y: Math.max(0, prev.y - 5) }))}
                    >
                      ↑
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setImagePosition(prev => ({ ...prev, y: Math.min(100, prev.y + 5) }))}
                    >
                      ↓
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setImagePosition(prev => ({ ...prev, x: Math.max(0, prev.x - 5) }))}
                    >
                      ←
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setImagePosition(prev => ({ ...prev, x: Math.min(100, prev.x + 5) }))}
                    >
                      →
                    </Button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setImageZoom(prev => Math.max(50, prev - 10))}
                    >
                      -
                    </Button>
                    <span className="text-xs font-medium min-w-[50px] text-center">{imageZoom}%</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setImageZoom(prev => Math.min(200, prev + 10))}
                    >
                      +
                    </Button>
                  </div>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => {
                      setImagePosition({ x: 50, y: 50 });
                      setImageZoom(100);
                    }}
                  >
                    Reset
                  </Button>
                </div>
                <div className="relative h-80 overflow-hidden bg-muted">
                  <img 
                    src={aircraftData.images[0].media.path} 
                    alt="Aircraft exterior"
                    className="w-full h-full object-cover transition-all duration-200"
                    style={{ 
                      objectPosition: `${imagePosition.x}% ${imagePosition.y}%`,
                      transform: `scale(${imageZoom / 100})`,
                      transformOrigin: `${imagePosition.x}% ${imagePosition.y}%`
                    }}
                  />
                </div>
              </div>
            )}

            <div className="p-12 space-y-12">
              {/* Key Stats - What matters to a flyer */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {aircraftData.passengers_max && (
                  <div className="text-center p-6 bg-card border rounded-xl hover:shadow-lg transition-all">
                    <p className="text-5xl font-light text-foreground mb-2">{aircraftData.passengers_max}</p>
                    <p className="text-sm uppercase tracking-wider text-muted-foreground font-medium">Passengers</p>
                  </div>
                )}
                {aircraftData.aircraft_extension?.sleeping_places && (
                  <div className="text-center p-6 bg-card border rounded-xl hover:shadow-lg transition-all">
                    <p className="text-5xl font-light text-foreground mb-2">{aircraftData.aircraft_extension.sleeping_places}</p>
                    <p className="text-sm uppercase tracking-wider text-muted-foreground font-medium">Sleeping Places</p>
                  </div>
                )}
                {aircraftData.year_of_production && (
                  <div className="text-center p-6 bg-card border rounded-xl hover:shadow-lg transition-all">
                    <p className="text-5xl font-light text-foreground mb-2">{aircraftData.year_of_production}</p>
                    <p className="text-sm uppercase tracking-wider text-muted-foreground font-medium">Year Built</p>
                  </div>
                )}
                {aircraftData.aircraft_extension?.refurbishment && (
                  <div className="text-center p-6 bg-card border rounded-xl hover:shadow-lg transition-all">
                    <p className="text-5xl font-light text-foreground mb-2">{aircraftData.aircraft_extension.refurbishment}</p>
                    <p className="text-sm uppercase tracking-wider text-muted-foreground font-medium">Refurbished</p>
                  </div>
                )}
              </div>

              {/* Cabin Gallery */}
              {aircraftData.images && aircraftData.images.some((img: any) => img.tag?.value === 'cabin') && (
                <>
                  <Separator className="my-12" />
                  <div>
                    <h2 className="text-xs font-medium tracking-wide text-muted-foreground mb-4 uppercase">Interior Gallery</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      {aircraftData.images
                        .filter((img: any) => img.tag?.value === 'cabin')
                        .map((image: any) => (
                          <div 
                            key={image.media.id} 
                            className="aspect-[4/3] overflow-hidden rounded-xl border shadow-md hover:shadow-xl transition-all cursor-pointer"
                            onClick={() => setSelectedImage(image.media.path)}
                          >
                            <img 
                              src={image.media.path} 
                              alt="Aircraft interior"
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}

              {/* Floor Plan */}
              {aircraftData.images?.find((img: any) => img.tag?.value === 'plan') && (
                <>
                  <Separator className="my-12" />
                  <div>
                    <h2 className="text-xs font-medium tracking-wide text-muted-foreground mb-4 uppercase">Aircraft Layout</h2>
                    <div className="mb-3 p-3 bg-muted/50 rounded-lg border border-muted">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Note:</span> This layout is representative of the aircraft type and may not reflect the exact seating configuration of this specific aircraft.
                      </p>
                    </div>
                    <div 
                      className="bg-card p-8 rounded-xl border shadow-lg cursor-pointer hover:shadow-2xl transition-shadow"
                      onClick={() => setSelectedImage(aircraftData.images.find((img: any) => img.tag?.value === 'plan').media.path)}
                    >
                      <img 
                        src={aircraftData.images.find((img: any) => img.tag?.value === 'plan').media.path}
                        alt="Aircraft floor plan"
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Amenities - The Experience */}
              {(Object.values(selectedAmenities).some(v => v) || customAmenities.some(a => a.trim())) && (
                <>
                  <Separator className="my-12" />
                  <div>
                    <h2 className="text-xs font-medium tracking-wide text-muted-foreground mb-4 uppercase">Premium Amenities</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedAmenities.wifi && (
                        <div className="flex items-center gap-4 p-5 bg-card border rounded-xl hover:shadow-md transition-all">
                          <div className="w-2 h-2 rounded-full bg-accent" />
                          <span className="text-lg font-light tracking-wide">Complimentary WiFi</span>
                        </div>
                      )}
                      {selectedAmenities.entertainment && (
                        <div className="flex items-center gap-4 p-5 bg-card border rounded-xl hover:shadow-md transition-all">
                          <div className="w-2 h-2 rounded-full bg-accent" />
                          <span className="text-lg font-light tracking-wide">Entertainment System</span>
                        </div>
                      )}
                      {selectedAmenities.shower && (
                        <div className="flex items-center gap-4 p-5 bg-card border rounded-xl hover:shadow-md transition-all">
                          <div className="w-2 h-2 rounded-full bg-accent" />
                          <span className="text-lg font-light tracking-wide">Private Shower</span>
                        </div>
                      )}
                      {selectedAmenities.pets && (
                        <div className="flex items-center gap-4 p-5 bg-card border rounded-xl hover:shadow-md transition-all">
                          <div className="w-2 h-2 rounded-full bg-accent" />
                          <span className="text-lg font-light tracking-wide">Pet Friendly</span>
                        </div>
                      )}
                      {selectedAmenities.divan && aircraftData.aircraft_extension?.divan_seats && (
                        <div className="flex items-center gap-4 p-5 bg-card border rounded-xl hover:shadow-md transition-all">
                          <div className="w-2 h-2 rounded-full bg-accent" />
                          <span className="text-lg font-light tracking-wide">{aircraftData.aircraft_extension.divan_seats} Divan Seats</span>
                        </div>
                      )}
                      {customAmenities.filter(a => a.trim()).map((amenity, index) => (
                        <div key={`custom-${index}`} className="flex items-center gap-4 p-5 bg-card border rounded-xl hover:shadow-md transition-all">
                          <div className="w-2 h-2 rounded-full bg-accent" />
                          <span className="text-lg font-light tracking-wide">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Footer */}
              <div className="pt-8 border-t text-center">
                <p className="text-sm text-muted-foreground font-light tracking-widest uppercase">
                  Stratos Jet Charters
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
