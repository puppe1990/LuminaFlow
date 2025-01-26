"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getGenerationHistory, deleteHistoryItem } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { GenerationHistoryItem } from "@/types"

export default function HistoryPage() {
  const [history, setHistory] = useState<GenerationHistoryItem[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchHistory = () => {
      const data = getGenerationHistory()
      setHistory(data)
    }

    fetchHistory()
    window.addEventListener("storage", fetchHistory)

    return () => {
      window.removeEventListener("storage", fetchHistory)
    }
  }, [])

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteHistoryItem(itemToDelete)
      setHistory((prevHistory) => prevHistory.filter((item) => item.id !== itemToDelete))
      toast({
        title: "History Item Deleted",
        description: "The selected history item has been removed.",
      })
      // Trigger a storage event to update other components
      window.dispatchEvent(new Event("storage"))
    }
    setIsDeleteDialogOpen(false)
    setItemToDelete(null)
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Video Generation History</h1>
      <div className="grid gap-6">
        {history.map((item) => (
          <Card key={item.id} className="bg-secondary/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{item.concept}</CardTitle>
                <CardDescription>Created on {new Date(item.createdAt).toLocaleString()}</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteClick(item.id)}
                className="text-destructive hover:text-destructive/90"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {item.numParts} sections • Script: {item.scriptProvider} • Image: {item.imageProvider}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this history item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsDeleteDialogOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={confirmDelete} variant="destructive">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

