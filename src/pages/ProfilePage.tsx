/**
 * Candidate Profile Page
 * Comprehensive profile management with all candidate information
 */

import { useState, useEffect } from 'react';
import { useCandidateAuth } from '@/contexts/CandidateAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { CandidatePageLayout } from '@/shared/components/layouts/CandidatePageLayout';
import { AtsPageHeader } from '@/shared/components/layouts/AtsPageHeader';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { useToast } from '@/shared/hooks/use-toast';
import { apiClient } from '@/shared/services/api';
import { Loader2, User, Briefcase, Shield, Globe, DollarSign, MapPin } from 'lucide-react';
import { Separator } from '@/shared/components/ui/separator';
// import { DeveloperTools } from '@/shared/components/dev/DeveloperTools';

export default function ProfilePage() {
  const { candidate, refreshCandidate } = useCandidateAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: candidate?.firstName || '',
    lastName: candidate?.lastName || '',
    phone: candidate?.phone || '',
    email: candidate?.email || '',
    city: candidate?.city || '',
    state: candidate?.state || '',
    country: candidate?.country || 'United States',
    linkedInUrl: candidate?.linkedInUrl || '',

    // Work Eligibility & Visa
    workEligibility: 'citizen', // citizen, permanent_resident, work_visa, student_visa, need_sponsorship
    visaStatus: '',
    requiresSponsorship: false,

    // Job Preferences
    preferredJobTypes: [] as string[], // full-time, part-time, contract, internship
    expectedSalaryMin: '',
    expectedSalaryMax: '',
    salaryCurrency: 'USD',
    relocationWilling: false,
    preferredLocations: '',
    remotePreference: 'hybrid', // remote, hybrid, onsite, flexible

    // Privacy Settings
    profileVisibility: 'public', // public, private, recruiters_only
    showContactInfo: true,
    showSalaryExpectations: false,
    allowRecruiterContact: true,
  });

  useEffect(() => {
    if (candidate) {
      setFormData(prev => ({
        ...prev,
        firstName: candidate.firstName || '',
        lastName: candidate.lastName || '',
        phone: candidate.phone || '',
        email: candidate.email || '',
        city: candidate.city || '',
        state: candidate.state || '',
        country: candidate.country || 'United States',
        linkedInUrl: candidate.linkedInUrl || '',

        // Work Eligibility
        workEligibility: candidate.workEligibility || 'citizen',
        visaStatus: candidate.visaStatus || '',
        requiresSponsorship: candidate.requiresSponsorship || false,

        // Job Preferences
        preferredJobTypes: candidate.jobTypePreference || [],
        expectedSalaryMin: candidate.expectedSalaryMin || '',
        expectedSalaryMax: candidate.expectedSalaryMax || '',
        salaryCurrency: candidate.salaryCurrency || 'USD',
        relocationWilling: candidate.relocationWilling || false,
        preferredLocations: candidate.preferredLocations || '',
        remotePreference: candidate.remotePreference || 'hybrid',

        // Privacy Settings
        profileVisibility: candidate.profileVisibility || 'public',
        showContactInfo: candidate.showContactInfo !== undefined ? candidate.showContactInfo : true,
        showSalaryExpectations: candidate.showSalaryExpectations || false,
        allowRecruiterContact: candidate.allowRecruiterContact !== undefined ? candidate.allowRecruiterContact : true,
      }));
    }
  }, [candidate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.put('/api/candidate/profile', formData);
      await refreshCandidate();
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.response?.data?.error || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleJobType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      preferredJobTypes: prev.preferredJobTypes.includes(type)
        ? prev.preferredJobTypes.filter(t => t !== type)
        : [...prev.preferredJobTypes, type]
    }));
  };

  return (
    <CandidatePageLayout>
      <div className="p-6 space-y-6">
        <AtsPageHeader
          title="My Profile"
          subtitle="Manage your candidate profile and preferences"
        />
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription className="text-sm">Your basic contact and location details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* LinkedIn Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Globe className="h-5 w-5" />
                LinkedIn Profile
              </CardTitle>
              <CardDescription className="text-sm">Connect your LinkedIn profile for better job matches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="linkedInUrl">LinkedIn Profile URL</Label>
                <Input
                  id="linkedInUrl"
                  type="url"
                  value={formData.linkedInUrl}
                  onChange={(e) => setFormData({ ...formData, linkedInUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
            </CardContent>
          </Card>

          {/* Work Eligibility & Visa Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Work Eligibility & Visa Status
              </CardTitle>
              <CardDescription className="text-sm">Your authorization to work and visa requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workEligibility">Work Authorization Status</Label>
                <Select
                  value={formData.workEligibility}
                  onValueChange={(value) => setFormData({ ...formData, workEligibility: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="citizen">Citizen</SelectItem>
                    <SelectItem value="permanent_resident">Permanent Resident / Green Card</SelectItem>
                    <SelectItem value="work_visa">Work Visa (H1B, L1, etc.)</SelectItem>
                    <SelectItem value="student_visa">Student Visa (F1 with OPT/CPT)</SelectItem>
                    <SelectItem value="need_sponsorship">Require Sponsorship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.workEligibility === 'work_visa' && (
                <div className="space-y-2">
                  <Label htmlFor="visaStatus">Visa Type</Label>
                  <Input
                    id="visaStatus"
                    value={formData.visaStatus}
                    onChange={(e) => setFormData({ ...formData, visaStatus: e.target.value })}
                    placeholder="e.g., H1B, L1, O1"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Visa Sponsorship</Label>
                  <p className="text-sm text-muted-foreground">
                    Do you need employer sponsorship for work authorization?
                  </p>
                </div>
                <Switch
                  checked={formData.requiresSponsorship}
                  onCheckedChange={(checked) => setFormData({ ...formData, requiresSponsorship: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Job Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Job Preferences
              </CardTitle>
              <CardDescription className="text-sm">Your ideal job type, location, and work arrangement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Job Types */}
              <div className="space-y-3">
                <Label>Preferred Job Types</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'full-time', label: 'Full-time' },
                    { value: 'part-time', label: 'Part-time' },
                    { value: 'contract', label: 'Contract' },
                    { value: 'internship', label: 'Internship' },
                  ].map((type) => (
                    <div
                      key={type.value}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${formData.preferredJobTypes.includes(type.value)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                        }`}
                      onClick={() => toggleJobType(type.value)}
                    >
                      <span className="text-sm font-medium">{type.label}</span>
                      <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${formData.preferredJobTypes.includes(type.value)
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                        }`}>
                        {formData.preferredJobTypes.includes(type.value) && (
                          <div className="h-2 w-2 bg-white rounded-sm" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Salary Expectations */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Salary Expectations
                </Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salaryMin" className="text-xs">Minimum</Label>
                    <Input
                      id="salaryMin"
                      type="number"
                      value={formData.expectedSalaryMin}
                      onChange={(e) => setFormData({ ...formData, expectedSalaryMin: e.target.value })}
                      placeholder="50000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salaryMax" className="text-xs">Maximum</Label>
                    <Input
                      id="salaryMax"
                      type="number"
                      value={formData.expectedSalaryMax}
                      onChange={(e) => setFormData({ ...formData, expectedSalaryMax: e.target.value })}
                      placeholder="100000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-xs">Currency</Label>
                    <Select
                      value={formData.salaryCurrency}
                      onValueChange={(value) => setFormData({ ...formData, salaryCurrency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                        <SelectItem value="AUD">AUD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Remote Preference */}
              <div className="space-y-3">
                <Label>Work Location Preference</Label>
                <Select
                  value={formData.remotePreference}
                  onValueChange={(value) => setFormData({ ...formData, remotePreference: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Remote Only</SelectItem>
                    <SelectItem value="hybrid">Hybrid (Remote + Office)</SelectItem>
                    <SelectItem value="onsite">On-site Only</SelectItem>
                    <SelectItem value="flexible">Flexible / Open to All</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Relocation */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Willing to Relocate</Label>
                    <p className="text-sm text-muted-foreground">
                      Are you open to relocating for the right opportunity?
                    </p>
                  </div>
                  <Switch
                    checked={formData.relocationWilling}
                    onCheckedChange={(checked) => setFormData({ ...formData, relocationWilling: checked })}
                  />
                </div>

                {formData.relocationWilling && (
                  <div className="space-y-2">
                    <Label htmlFor="preferredLocations">Preferred Locations</Label>
                    <Textarea
                      id="preferredLocations"
                      value={formData.preferredLocations}
                      onChange={(e) => setFormData({ ...formData, preferredLocations: e.target.value })}
                      placeholder="e.g., San Francisco, New York, Austin, Remote"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Visibility Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Visibility Settings
              </CardTitle>
              <CardDescription className="text-sm">Control who can see your profile and contact you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Profile Visibility</Label>
                <Select
                  value={formData.profileVisibility}
                  onValueChange={(value) => setFormData({ ...formData, profileVisibility: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Visible to everyone</SelectItem>
                    <SelectItem value="recruiters_only">Recruiters Only - Only verified recruiters</SelectItem>
                    <SelectItem value="private">Private - Only you can see</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Contact Information</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow recruiters to see your phone and email
                    </p>
                  </div>
                  <Switch
                    checked={formData.showContactInfo}
                    onCheckedChange={(checked) => setFormData({ ...formData, showContactInfo: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Salary Expectations</Label>
                    <p className="text-sm text-muted-foreground">
                      Display your salary range to potential employers
                    </p>
                  </div>
                  <Switch
                    checked={formData.showSalaryExpectations}
                    onCheckedChange={(checked) => setFormData({ ...formData, showSalaryExpectations: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Recruiter Contact</Label>
                    <p className="text-sm text-muted-foreground">
                      Let recruiters reach out to you with opportunities
                    </p>
                  </div>
                  <Switch
                    checked={formData.allowRecruiterContact}
                    onCheckedChange={(checked) => setFormData({ ...formData, allowRecruiterContact: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" size="sm">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} size="sm">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>

        {/* Developer Tools - Only visible in development mode */}
        {/* <DeveloperTools /> */}
      </div>
    </CandidatePageLayout>
  );
}
