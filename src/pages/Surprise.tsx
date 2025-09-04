import { AppLayout } from '@/layouts/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw } from 'lucide-react';

const Surprise = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Surprise me!</h1>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-foreground">Random Workout</h3>
            <p className="text-muted-foreground mb-4">
              Get a personalized workout suggestion based on your preferences and available time.
            </p>
            <Button className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              Generate Workout
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-foreground">Wellness Tip</h3>
            <p className="text-muted-foreground mb-4">
              Discover a new wellness tip or mindfulness exercise to brighten your day.
            </p>
            <Button variant="outline" className="w-full gap-2">
              <Sparkles className="h-4 w-4" />
              Get Tip
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-foreground">Quick Challenge</h3>
            <p className="text-muted-foreground mb-4">
              Take on a 5-minute wellness challenge to boost your energy and mood.
            </p>
            <Button variant="secondary" className="w-full gap-2">
              <Sparkles className="h-4 w-4" />
              Start Challenge
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-foreground">Mood Booster</h3>
            <p className="text-muted-foreground mb-4">
              Get a personalized activity recommendation based on your current mood.
            </p>
            <Button variant="outline" className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              Surprise Me
            </Button>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Surprise;