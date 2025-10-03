"use client"

import { Button } from "@/components/ui/button"
import { Building2, LogOut } from "lucide-react"

interface NavbarProps {
  title: string
  userRole?: string
}

export function Navbar({ title, userRole }: NavbarProps) {
  const handleLogout = () => {
    window.location.href = "/"
  }

  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">AI Loan Platform</h1>
            {userRole && <p className="text-xs text-muted-foreground">{userRole}</p>}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-foreground">{title}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center space-x-2 bg-transparent"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  )
}
