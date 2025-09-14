import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { User, Edit, Save, X, LogOut, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const { profile, loading: profileLoading, refreshProfile } = useProfile(user?.id);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [isEditingWellness, setIsEditingWellness] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    fitness_level: '',
    preferred_workout_duration: 30,
    bio: ''
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        fitness_level: profile.fitness_level || '',
        preferred_workout_duration: profile.preferred_workout_duration || 30,
        bio: profile.bio || ''
      });
    }
  }, [profile]);

  const handleSaveBasic = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      // Refresh the profile data to update all components
      await refreshProfile();

      toast({
        title: "Basic Information Updated",
        description: "Your basic information has been successfully updated.",
      });

      setIsEditingBasic(false);
    } catch (error) {
      console.error('Error updating basic info:', error);
      toast({
        title: "Error",
        description: "Failed to update basic information. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSaveWellness = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          fitness_level: formData.fitness_level,
          preferred_workout_duration: formData.preferred_workout_duration,
          bio: formData.bio
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      // Refresh the profile data to update all components
      await refreshProfile();

      toast({
        title: "Wellness Preferences Updated",
        description: "Your wellness preferences have been successfully updated.",
      });

      setIsEditingWellness(false);
    } catch (error) {
      console.error('Error updating wellness preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update wellness preferences. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePasswordSave = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password Error",
        description: "Passwords do not match.",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Password Error", 
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });

      setPasswordData({ newPassword: '', confirmPassword: '' });
      setIsEditingPassword(false);
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePasswordCancel = () => {
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setIsEditingPassword(false);
  };

  const handleCancelBasic = () => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        display_name: profile.display_name || ''
      }));
    }
    setIsEditingBasic(false);
  };

  const handleCancelWellness = () => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        fitness_level: profile.fitness_level || '',
        preferred_workout_duration: profile.preferred_workout_duration || 30,
        bio: profile.bio || ''
      }));
    }
    setIsEditingWellness(false);
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-warm">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-warm">
      {/* Header */}
      <header className="shrink-0 px-4 py-2 safe-area-inset-top">
        <div className="flex justify-between items-center">
          <div className="flex-1 flex justify-center">
            <Link to="/">
              <img 
                src="/lovable-uploads/3b31a267-d041-45de-8edb-7ea25281346e.png" 
                alt="KindCue Logo" 
                className="h-16 w-auto cursor-pointer hover:opacity-80 transition-opacity"
              />
            </Link>
          </div>
          
          <div className="absolute right-4 flex items-center gap-1">
            <span className="text-xs text-muted-foreground hidden sm:block max-w-20 truncate">
              {user.user_metadata?.display_name || profile?.display_name || user.email}
            </span>
            <Button
              onClick={signOut}
              variant="outline"
              size="sm"
              className="gap-1 h-8 px-2"
            >
              <LogOut className="h-3 w-3" />
              <span className="hidden sm:inline text-xs">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-2 pb-16">
        <div className="space-y-2">
          <div className="grid gap-2 md:grid-cols-2">
            <Card>
              <CardHeader className="py-2 px-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold">Basic Information</CardTitle>
                  {!isEditingBasic ? (
                    <Button onClick={() => setIsEditingBasic(true)} variant="outline" size="sm" className="h-6 w-6 p-0">
                      <Edit className="h-3 w-3" />
                    </Button>
                  ) : (
                    <div className="flex gap-1">
                      <Button onClick={handleSaveBasic} size="sm" className="h-6 w-6 p-0">
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button onClick={handleCancelBasic} variant="outline" size="sm" className="h-6 w-6 p-0">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="email" className="text-[10px] min-w-0 shrink-0 w-16">Email</Label>
                  <div className="flex-1">
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted text-[10px] h-8 whitespace-nowrap overflow-hidden text-ellipsis"
                    />
                    <p className="text-[8px] text-muted-foreground mt-1">
                      Contact kindcue@gmail.com to change email address
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="display_name" className="text-[10px] min-w-0 shrink-0 w-16">Name</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                    disabled={!isEditingBasic}
                    placeholder="How should we address you?"
                    className="text-[10px] h-8 flex-1"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px]">Password</Label>
                    {!isEditingPassword ? (
                       <Button onClick={() => setIsEditingPassword(true)} variant="outline" size="sm" className="gap-1 text-xs h-6">
                         <Edit className="h-3 w-3" />
                         Change Password
                       </Button>
                    ) : (
                      <div className="flex gap-1">
                        <Button onClick={handlePasswordSave} size="sm" className="gap-1 text-xs h-6">
                          <Save className="h-3 w-3" />
                          Save
                        </Button>
                        <Button onClick={handlePasswordCancel} variant="outline" size="sm" className="gap-1 text-xs h-6">
                          <X className="h-3 w-3" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {isEditingPassword && (
                    <>
                      <div className="space-y-1">
                        <Label htmlFor="new_password" className="text-xs">New Password</Label>
                        <Input
                          id="new_password"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Enter new password"
                          minLength={6}
                          className="text-xs h-8"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="confirm_password" className="text-xs">Confirm New Password</Label>
                        <Input
                          id="confirm_password"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirm new password"
                          minLength={6}
                          className="text-xs h-8"
                        />
                      </div>

                      <p className="text-[10px] text-muted-foreground">
                        Password must be at least 6 characters long
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-2 px-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold">Wellness Preferences</CardTitle>
                  {!isEditingWellness ? (
                    <Button onClick={() => setIsEditingWellness(true)} variant="outline" size="sm" className="h-6 w-6 p-0">
                      <Edit className="h-3 w-3" />
                    </Button>
                  ) : (
                    <div className="flex gap-1">
                      <Button onClick={handleSaveWellness} size="sm" className="h-6 w-6 p-0">
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button onClick={handleCancelWellness} variant="outline" size="sm" className="h-6 w-6 p-0">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="fitness_level" className="text-xs min-w-0 shrink-0 w-16">Level</Label>
                  <Input
                    id="fitness_level"
                    value={formData.fitness_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, fitness_level: e.target.value }))}
                    disabled={!isEditingWellness}
                    placeholder="e.g., Beginner, Intermediate, Advanced"
                    className="text-xs h-8 flex-1"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="workout_duration" className="text-xs min-w-0 shrink-0 w-16">Duration</Label>
                  <Input
                    id="workout_duration"
                    type="number"
                    value={formData.preferred_workout_duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, preferred_workout_duration: parseInt(e.target.value) || 30 }))}
                    disabled={!isEditingWellness}
                    min="5"
                    max="120"
                    className="text-xs h-8 flex-1"
                  />
                </div>

                <div className="flex items-start gap-2">
                  <Label htmlFor="bio" className="text-xs min-w-0 shrink-0 w-16 pt-2">Goals</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    disabled={!isEditingWellness}
                    placeholder="Share your fitness goals, wellness journey, and what motivates you..."
                    className="min-h-[60px] text-xs flex-1"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;