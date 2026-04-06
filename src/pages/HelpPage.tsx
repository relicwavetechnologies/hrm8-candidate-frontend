import { LifeBuoy, MessageSquare, Settings, Briefcase } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CandidatePageLayout } from '@/shared/components/layouts/CandidatePageLayout'
import { AtsPageHeader } from '@/shared/components/layouts/AtsPageHeader'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'

export default function HelpPage() {
  const navigate = useNavigate()

  return (
    <CandidatePageLayout>
      <div className="space-y-6 p-6">
        <AtsPageHeader
          title="Help"
          subtitle="Find the quickest path to the next action in your candidate workspace."
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/60 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <LifeBuoy className="h-5 w-5 text-primary" />
                Account support
              </CardTitle>
              <CardDescription>
                Update preferences, password, and notification settings from one place.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => navigate('/candidate/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Open settings
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-5 w-5 text-primary" />
                Hiring conversations
              </CardTitle>
              <CardDescription>
                Review recruiter messages and continue active application threads.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => navigate('/candidate/messages')}>
                View messages
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="h-5 w-5 text-primary" />
                Find roles
              </CardTitle>
              <CardDescription>
                Keep moving by browsing open roles and reviewing saved opportunities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate('/candidate/jobs')}>
                Browse jobs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </CandidatePageLayout>
  )
}
