"use client"

import { Search, Filter, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function CandidateFilters() {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
      <div className="relative w-full md:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search candidates..."
          className="pl-10 bg-card border-border rounded-xl"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px] bg-card border-border rounded-xl">
            <SelectValue placeholder="All Recommendations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Recommendations</SelectItem>
            <SelectItem value="strong-interview">Strong Interview</SelectItem>
            <SelectItem value="interview">Interview</SelectItem>
            <SelectItem value="review">Review</SelectItem>
            <SelectItem value="possible-review">Possible Review</SelectItem>
            <SelectItem value="reject">Reject</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="all-scores">
          <SelectTrigger className="w-[140px] bg-card border-border rounded-xl">
            <SelectValue placeholder="All Scores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-scores">All Scores</SelectItem>
            <SelectItem value="80-100">80 - 100</SelectItem>
            <SelectItem value="65-79">65 - 79</SelectItem>
            <SelectItem value="50-64">50 - 64</SelectItem>
            <SelectItem value="0-49">0 - 49</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" className="gap-2 bg-card border-border rounded-xl">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>
    </div>
  )
}
