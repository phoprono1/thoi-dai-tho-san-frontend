'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Button,
} from '@/components/ui/button';
import {
  Input,
} from '@/components/ui/input';
import {
  Label,
} from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { 
  Plus,
  Trash2,
  Upload,
  Star,
  Palette,
  Calendar,
  Crown,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApiEndpoints } from '@/lib/admin-api';
import { resolveAssetUrl } from '@/lib/asset';

interface PetImage {
  id: number;
  imageUrl: string;
  imageType: 'evolution' | 'event' | 'variant' | 'base';
  evolutionStage?: number;
  skinName?: string;
  isDefault: boolean;
  sortOrder: number;
}

interface PetImageManagerProps {
  petId: number;
  petName: string;
  maxEvolutionStage: number;
  images: string[]; // Legacy format
  petImages?: PetImage[]; // New structured format
  onImageUploaded: () => void;
}

const IMAGE_TYPES = [
  { value: 'base', label: '🐾 Base Form', icon: '🐾', description: 'Default appearance' },
  { value: 'evolution', label: '⭐ Evolution', icon: '⭐', description: 'Evolution stages' },
  { value: 'event', label: '🎉 Event Skin', icon: '🎉', description: 'Limited time skins' },
  { value: 'variant', label: '🎨 Variant', icon: '🎨', description: 'Alternative designs' },
];

export default function PetImageManager({ 
  petId, 
  petName, 
  maxEvolutionStage, 
  images, 
  petImages,
  onImageUploaded 
}: PetImageManagerProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    imageType: 'base' as 'evolution' | 'event' | 'variant' | 'base',
    evolutionStage: 1,
    skinName: '',
    isDefault: false,
    sortOrder: 0,
  });

  // Use structured images if available, otherwise convert legacy format
  const structuredImages: PetImage[] = petImages || images.map((url, index) => ({
    id: index, // Temporary ID for legacy images
    imageUrl: url,
    imageType: 'base' as const,
    isDefault: index === 0,
    sortOrder: index,
  }));

  const handleUploadImage = async () => {
    if (!selectedFile) {
      toast.error('Please select an image file');
      return;
    }

    try {
      // Upload image first
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      const response = await adminApiEndpoints.uploadPetDefinitionImage(petId, formData);
      
      // Then add metadata (this would require new backend endpoint)
      // await adminApiEndpoints.addPetImageMetadata(petId, {
      //   imageUrl: response.data.path,
      //   ...uploadForm
      // });

      toast.success('Image uploaded successfully');
      setSelectedFile(null);
      setIsUploadDialogOpen(false);
      onImageUploaded();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
  };

  const handleDeleteImage = async (imageId: number, imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      // Find the index of this image in the legacy array
      const imageIndex = images.findIndex(img => img === imageUrl);
      if (imageIndex !== -1) {
        await adminApiEndpoints.deletePetImage(petId, imageIndex);
        toast.success('Image deleted successfully');
        onImageUploaded();
      } else {
        toast.error('Image not found');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  const getImageTypeInfo = (type: string) => {
    return IMAGE_TYPES.find(t => t.value === type) || IMAGE_TYPES[0];
  };

  const groupImagesByType = () => {
    const grouped: Record<string, PetImage[]> = {
      base: [],
      evolution: [],
      event: [],
      variant: [],
    };

    structuredImages.forEach(image => {
      grouped[image.imageType].push(image);
    });

    return grouped;
  };

  const groupedImages = groupImagesByType();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {petName} Images
            </CardTitle>
            <CardDescription>
              Manage evolution stages, event skins, and variants
            </CardDescription>
          </div>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Image
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Pet Image</DialogTitle>
                <DialogDescription>
                  Add a new image for {petName} with proper categorization
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Image File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageType">Image Type</Label>
                  <Select
                    value={uploadForm.imageType}
                    onValueChange={(value: 'evolution' | 'event' | 'variant' | 'base') => 
                      setUploadForm({ ...uploadForm, imageType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IMAGE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {uploadForm.imageType === 'evolution' && (
                  <div className="space-y-2">
                    <Label htmlFor="evolutionStage">Evolution Stage</Label>
                    <Select
                      value={uploadForm.evolutionStage.toString()}
                      onValueChange={(value) => 
                        setUploadForm({ ...uploadForm, evolutionStage: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: maxEvolutionStage }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            Stage {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(uploadForm.imageType === 'event' || uploadForm.imageType === 'variant') && (
                  <div className="space-y-2">
                    <Label htmlFor="skinName">Skin Name</Label>
                    <Input
                      id="skinName"
                      placeholder="e.g., Christmas Edition, Fire Festival"
                      value={uploadForm.skinName}
                      onChange={(e) => setUploadForm({ ...uploadForm, skinName: e.target.value })}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isDefault"
                    checked={uploadForm.isDefault}
                    onCheckedChange={(checked) => setUploadForm({ ...uploadForm, isDefault: checked })}
                  />
                  <Label htmlFor="isDefault">Set as default image</Label>
                </div>

                <Button 
                  onClick={handleUploadImage}
                  disabled={!selectedFile}
                  className="w-full"
                >
                  {selectedFile ? 'Upload Image' : 'Select a file first'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedImages).map(([type, images]) => {
          if (images.length === 0) return null;
          
          const typeInfo = getImageTypeInfo(type);
          
          return (
            <div key={type} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{typeInfo.icon}</span>
                <h4 className="font-semibold">{typeInfo.label}</h4>
                <Badge variant="outline">{images.length}</Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={image.id || index} className="relative group">
                    <div className="aspect-square rounded-lg border overflow-hidden bg-muted">
                      <img
                        src={resolveAssetUrl(image.imageUrl) || ''}
                        alt={`${petName} ${type} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Image info overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col justify-between p-2">
                      <div className="space-y-1">
                        {image.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                        {type === 'evolution' && image.evolutionStage && (
                          <Badge variant="outline" className="text-xs">
                            Stage {image.evolutionStage}
                          </Badge>
                        )}
                        {image.skinName && (
                          <Badge variant="outline" className="text-xs">
                            {image.skinName}
                          </Badge>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteImage(image.id, image.imageUrl)}
                        className="h-8"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {structuredImages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No images uploaded yet.</p>
            <p className="text-sm">Upload images to see them organized by type.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}