import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Heart, Eye, EyeOff, Check, X } from 'lucide-react';

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Contains uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Contains lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'Contains number', test: (p) => /\d/.test(p) },
  { label: 'Contains special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) }
];

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signupPassword, setSignupPassword] = useState('');
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return passwordRequirements.every(req => req.test(password));
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const displayName = formData.get('displayName') as string;

    // Validate email
    if (!validateEmail(email)) {
      setFormErrors(prev => ({...prev, email: 'Please enter a valid email address'}));
      return;
    }

    // Validate password complexity
    if (!validatePassword(password)) {
      setFormErrors(prev => ({...prev, password: 'Password does not meet complexity requirements'}));
      return;
    }

    setIsSubmitting(true);
    await signUp(email, password, displayName);
    setIsSubmitting(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Basic validation
    if (!validateEmail(email)) {
      setFormErrors(prev => ({...prev, signinEmail: 'Please enter a valid email address'}));
      return;
    }

    if (password.length < 1) {
      setFormErrors(prev => ({...prev, signinPassword: 'Password is required'}));
      return;
    }

    setIsSubmitting(true);
    await signIn(email, password);
    setIsSubmitting(false);
  };

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-warm">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-warm p-4">
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <img 
              src="/lovable-uploads/3b31a267-d041-45de-8edb-7ea25281346e.png" 
              alt="KindCue Logo" 
              className="h-20 w-auto"
            />
          </div>
          <p className="text-muted-foreground">
            Move how you feel!
          </p>
        </div>

        <Card className="shadow-warm border-border/50">
          <Tabs defaultValue="signin" className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="signin" className="m-0">
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4">
                  <CardTitle className="text-xs font-bold">Welcome back</CardTitle>
                  <CardDescription>
                    Sign in to continue your wellness journey
                  </CardDescription>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                      disabled={isSubmitting}
                      className={formErrors.signinEmail ? 'border-destructive text-[10px] h-6 px-2 py-1' : 'text-[10px] h-6 px-2 py-1'}
                    />
                    {formErrors.signinEmail && (
                      <p className="text-sm text-destructive">{formErrors.signinEmail}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        disabled={isSubmitting}
                        className={formErrors.signinPassword ? 'border-destructive pr-8 text-[10px] h-6 px-2 py-1' : 'pr-8 text-[10px] h-6 px-2 py-1'}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isSubmitting}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {formErrors.signinPassword && (
                      <p className="text-sm text-destructive">{formErrors.signinPassword}</p>
                    )}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-safety hover:opacity-90 transition-opacity"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="m-0">
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4">
                  <CardTitle className="text-xs font-bold">Join KindCue</CardTitle>
                  <CardDescription>
                    Start your compassionate wellness journey today
                  </CardDescription>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Display Name</Label>
                    <Input
                      id="signup-name"
                      name="displayName"
                      type="text"
                      placeholder="How should we address you?"
                      disabled={isSubmitting}
                      className="text-[10px] h-6 px-2 py-1"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                      disabled={isSubmitting}
                      className={formErrors.email ? 'border-destructive text-[10px] h-6 px-2 py-1' : 'text-[10px] h-6 px-2 py-1'}
                    />
                    {formErrors.email && (
                      <p className="text-sm text-destructive">{formErrors.email}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Choose a secure password"
                        required
                        disabled={isSubmitting}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className={formErrors.password ? 'border-destructive pr-8 text-[10px] h-6 px-2 py-1' : 'pr-8 text-[10px] h-6 px-2 py-1'}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isSubmitting}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Password Requirements */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Password must contain:</p>
                      {passwordRequirements.map((req, index) => {
                        const isValid = req.test(signupPassword);
                        return (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            {isValid ? (
                              <Check className="h-3 w-3 text-primary" />
                            ) : (
                              <X className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span className={isValid ? 'text-primary' : 'text-muted-foreground'}>
                              {req.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    
                    {formErrors.password && (
                      <p className="text-sm text-destructive">{formErrors.password}</p>
                    )}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-encouragement hover:opacity-90 transition-opacity"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          By joining KindCue, you're taking a compassionate step towards better wellness.
        </p>
      </div>
    </div>
  );
};

export default Auth;