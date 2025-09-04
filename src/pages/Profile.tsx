import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { profile, loading: profileLoading } = useProfile(user?.id);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    fitness_level: '',
    preferred_workout_duration: 30
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
        bio: profile.bio || '',
        fitness_level: profile.fitness_level || '',
        preferred_workout_duration: profile.preferred_workout_duration || 30
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name,
          bio: formData.bio,
          fitness_level: formData.fitness_level,
          preferred_workout_duration: formData.preferred_workout_duration
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        fitness_level: profile.fitness_level || '',
        preferred_workout_duration: profile.preferred_workout_duration || 30
      });
    }
    setIsEditing(false);
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
    <div className="min-h-screen bg-gradient-warm pb-20">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm shrink-0">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex-1 flex justify-center">
            <img 
              src="/lovable-uploads/3b31a267-d041-45de-8edb-7ea25281346e.png" 
              alt="KindCue Logo" 
              className="h-24 w-auto"
            />
          </div>
          
          <div className="absolute right-4 flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {user.user_metadata?.display_name || profile?.display_name || user.email}
            </span>
            <Button
              onClick={signOut}
              variant="outline"
              size="sm"
              className="gap-1"
            >
              <LogOut className="h-3 w-3" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">User Profile</h1>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="gap-2">
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSave} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button onClick={handleCancel} variant="outline" className="gap-2">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="How should we address you?"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Tell us about yourself..."
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Wellness Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fitness_level">Fitness Level</Label>
                  <Input
                    id="fitness_level"
                    value={formData.fitness_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, fitness_level: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="e.g., Beginner, Intermediate, Advanced"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workout_duration">Preferred Workout Duration (minutes)</Label>
                  <Input
                    id="workout_duration"
                    type="number"
                    value={formData.preferred_workout_duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, preferred_workout_duration: parseInt(e.target.value) || 30 }))}
                    disabled={!isEditing}
                    min="5"
                    max="120"
                  />
                </div>

                {profile?.wellness_goals && profile.wellness_goals.length > 0 && (
                  <div className="space-y-2">
                    <Label>Wellness Goals</Label>
                    <div className="flex flex-wrap gap-2">
                      {profile.wellness_goals.map((goal, index) => (
                        <Badge key={index} variant="secondary" className="capitalize">
                          {goal.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {profile?.favorite_workouts && profile.favorite_workouts.length > 0 && (
                  <div className="space-y-2">
                    <Label>Favorite Workouts</Label>
                    <div className="flex flex-wrap gap-2">
                      {profile.favorite_workouts.map((workout, index) => (
                        <Badge key={index} variant="outline" className="capitalize">
                          {workout.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;